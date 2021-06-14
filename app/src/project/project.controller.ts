import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Response,
    HttpStatus,
    Body,
    Query,
    Headers,
    UseGuards,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AxiosError, AxiosResponse } from 'axios';

import { ProjectService, PROJECT_TYPES_TO_SYNC } from './project.service';
import { TeamService } from '../team/team.service';
import { AuthService } from '../auth/auth.service';
import { Project } from './interfaces/project.interface';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { UserService } from '../user/user.service';

@Controller('project')
export class ProjectController {
    constructor(
        private readonly userService: UserService,
        private readonly projectService: ProjectService,
        private readonly teamService: TeamService,
        private readonly authService: AuthService,
        private readonly roleCollaborationService: RoleCollaborationService
    ) {}

    @Get('list')
    @UseGuards(AuthGuard())
    async projectList(
        @Headers() headers: any,
        @Response() res: any,
        @Query()
        params: {
            withTimerList?: string;
            slugSync?: string;
            withJiraProject?: string;
            isActive?: string;
            withUserInfo?: string;
            page?: string;
            limit?: string;
            searchValue?: string;
        }
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }
        let projectListRes: any = null;
        const { withJiraProject, slugSync, withTimerList, isActive, withUserInfo, page, limit, searchValue } = params;

        if ((page && limit && +page <= 0) || +limit <= 0) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            if (withJiraProject === 'true' && slugSync) {
                projectListRes = await this.projectService.getProjectListWithJiraProject(userId, slugSync);
            } else {
                projectListRes = await this.projectService.getProjectList(
                    userId,
                    withTimerList === 'true',
                    false,
                    isActive === 'true' || isActive === 'false' ? isActive === 'true' : null,
                    withUserInfo === 'true',
                    page,
                    limit,
                    searchValue
                );
            }
            return res.status(HttpStatus.OK).json(projectListRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get('reports-project')
    @UseGuards(AuthGuard())
    async reportsProjectList(@Headers() headers: any, @Response() res: any, @Query() params) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(params.projectName && params.startDate && params.endDate)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        if (params.userEmails && Object.prototype.toString.call(params.userEmails) !== '[object Array]') {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        let teamId = null;
        let currentTeamRes = null;
        try {
            currentTeamRes = await this.teamService.getCurrentTeam(userId);
            teamId = (currentTeamRes as AxiosResponse).data.user_team[0].team.id;
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }

        if (!teamId) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.NOT_MEMBER' });
        }

        const isAdmin =
            currentTeamRes.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        const isOwner =
            currentTeamRes.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_OWNER;

        if (!isOwner && !isAdmin) {
            try {
                const user: any = await this.userService.getUserById(userId);
                params.userEmails = [user.email];
            } catch (error) {
                console.log(error);
            }
        }

        try {
            const reportsProjectRes = await this.projectService.getReportsProject(
                teamId,
                params.projectName,
                params.userEmails || [],
                params.startDate,
                params.endDate,
                params.searchValue,
                params.combined === 'true'
            );
            return res.status(HttpStatus.OK).json(reportsProjectRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get('reports-projects')
    @UseGuards(AuthGuard())
    async reportsProjectsList(@Headers() headers: any, @Response() res: any, @Query() params) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (params.projectNames && Object.prototype.toString.call(params.projectNames) !== '[object Array]') {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        if (params.userEmails && Object.prototype.toString.call(params.userEmails) !== '[object Array]') {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            const reportsProjectsRes = await this.projectService.getReportsProjects(
                userId,
                params.projectNames || [],
                params.userEmails || [],
                params.startDate,
                params.endDate,
            );
            return res.status(HttpStatus.OK).json(reportsProjectsRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Post('add')
    @UseGuards(AuthGuard())
    async addProject(
        @Headers() headers: any,
        @Response() res: any,
        @Body() body: { project: Project; users: string[] }
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(body.project.name && body.project.projectColorId)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        if (!body.users) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            const projectId = ((await this.projectService.addProject(body.project, userId)) as AxiosResponse).data
                .insert_project_v2.returning[0].id;

            await this.projectService.addProjectUser(projectId, userId, body.users);
            return res.status(HttpStatus.OK).json(projectId);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get(':id')
    @UseGuards(AuthGuard())
    async getProjectById(@Headers() headers: any, @Param() param: any, @Response() res: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const getProjectByIdRes = await this.projectService.getProjectById(userId, param.id);
            return res.status(HttpStatus.OK).json(getProjectByIdRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Patch(':id')
    @UseGuards(AuthGuard())
    async updateProjectById(
        @Headers() headers: any,
        @Param() param: any,
        @Response() res: any,
        @Body() body: { project: Project; users: string[] }
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(body.project.name && body.project.projectColorId)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        if (!body.users) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            const updateProjectByIdRes = await this.projectService.updateProjectById(param.id, body.project, userId);

            await this.projectService.updateProjectUser(param.id, userId, body.users);
            return res.status(HttpStatus.OK).json(updateProjectByIdRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get(':slugSync/list')
    @UseGuards(AuthGuard())
    async getProjectsBySlugSync(@Headers() headers: any, @Param() param: any, @Response() res: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        const { slugSync } = param;
        if (![PROJECT_TYPES_TO_SYNC.JIRA].includes(slugSync)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            return res.status(HttpStatus.OK).json(await this.projectService.getProjectsBySync(userId, slugSync));
        } catch (e) {
            return res.status(HttpStatus.BAD_REQUEST).json({ error: e.message });
        }
    }

    @Patch(':id/active-status')
    @UseGuards(AuthGuard())
    async updateProjectActiveStatus(
        @Headers() headers: any,
        @Response() res: any,
        @Param() param: { id: string },
        @Body()
        body: {
            isActive: boolean;
        }
    ) {
        const userId: string = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            return res
                .status(HttpStatus.OK)
                .json(await this.projectService.updateProjectActiveStatus([param.id], body.isActive));
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Delete('user/:id')
    @UseGuards(AuthGuard())
    async deleteUserFromProjectById(
        @Headers() headers: any,
        @Param() param: any,
        @Response() res: any,
        @Body() body: { id: string }
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const deleteProjectUserByIdRes = await this.projectService.deleteProjectUserById(param.id, userId, body.id);

            return res.status(HttpStatus.OK).json(deleteProjectUserByIdRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }
}
