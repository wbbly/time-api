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
import {RoleCollaborationService} from "../role-collaboration/role-collaboration.service";
import {UserService} from "../user/user.service";

@Controller('project')
export class ProjectController {
    constructor(
        private readonly userService: UserService,
        private readonly projectService: ProjectService,
        private readonly teamService: TeamService,
        private readonly authService: AuthService,
        private readonly roleCollaborationService: RoleCollaborationService,
    ) {}

    @Get('list')
    @UseGuards(AuthGuard())
    async projectList(@Headers() headers: any, @Response() res: any, @Query() params) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }
        let projectListRes: any = null;
        const { withJiraProject, slugSync, withTimerList } = params;
        try {
            if (withJiraProject === 'true' && slugSync) {
                projectListRes = await this.projectService.getProjectListWithJiraProject(userId, slugSync);
            } else {
                projectListRes = await this.projectService.getProjectList(
                    userId,
                    withTimerList === 'true' ? true : false
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
                params.searchValue
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
            const reportsProjectsRes = await this.projectService.getReportsProjects(
                teamId,
                params.projectNames || [],
                params.userEmails || [],
                params.startDate,
                params.endDate
            );
            return res.status(HttpStatus.OK).json(reportsProjectsRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Post('add')
    @UseGuards(AuthGuard())
    async addProject(@Headers() headers: any, @Response() res: any, @Body() body: { project: Project }) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(body.project.name && body.project.projectColorId)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            const addProjectRes = await this.projectService.addProject(body.project, userId);
            return res.status(HttpStatus.OK).json(addProjectRes);
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
        @Body() body: { project: Project }
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(body.project.name && body.project.projectColorId)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            const updateProjectByIdRes = await this.projectService.updateProjectById(param.id, body.project, userId);
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
}
