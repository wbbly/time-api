import { Controller, Get, Post, Patch, Delete, Param, Response, HttpStatus, Body, Query } from '@nestjs/common';
import { AxiosError } from 'axios';

import { ProjectService } from './project.service';
import { Project } from './interfaces/project.interface';

@Controller('project')
export class ProjectController {
    constructor(private readonly projectService: ProjectService) {}

    @Get('list')
    async projectList(@Response() res: any) {
        try {
            const projectListRes = await this.projectService.getProjectList();
            return res.status(HttpStatus.OK).json(projectListRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Get('admin-list')
    async adminProjectList(@Response() res: any) {
        try {
            const adminProjectListRes = await this.projectService.getAdminProjectList();
            return res.status(HttpStatus.OK).json(adminProjectListRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Get('user-list')
    async userProjectList(@Response() res: any, @Query() params) {
        if (!(params && params.userId)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameter userId is required!' });
        }

        try {
            const userProjectListRes = await this.projectService.getUserProjectList(params.userId);
            return res.status(HttpStatus.OK).json(userProjectListRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Get('reports-project')
    async reportsProjectList(@Response() res: any, @Query() params) {
        if (!(params && params.projectName && params.startDate && params.endDate)) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'Parameters projectName, startDate and endDate are required!' });
        }

        if (params && params.userEmails && Object.prototype.toString.call(params.userEmails) !== '[object Array]') {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameters userEmails needs to be an array!' });
        }

        try {
            const reportsProjectRes = await this.projectService.getReportsProject(
                params.projectName,
                params.userEmails || [],
                params.startDate,
                params.endDate
            );
            return res.status(HttpStatus.OK).json(reportsProjectRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Get('reports-projects')
    async reportsProjectsList(@Response() res: any, @Query() params) {
        if (params && params.projectNames && Object.prototype.toString.call(params.projectNames) !== '[object Array]') {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameters projectNames needs to be an array!' });
        }

        if (params && params.userEmails && Object.prototype.toString.call(params.userEmails) !== '[object Array]') {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameters userEmails needs to be an array!' });
        }

        try {
            const reportsProjectsRes = await this.projectService.getReportsProjects(
                params.projectNames || [],
                params.userEmails || [],
                params.startDate,
                params.endDate
            );
            return res.status(HttpStatus.OK).json(reportsProjectsRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Post('add')
    //@TODO: Make sure to implement userId passage from front.
    async addProject(@Response() res: any, @Body() body: { project: Project; userId: string }) {
        if (!(body && body.userId && body.project.name && body.project.projectColorId)) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'User ID, Project name and projectColorId are required!' });
        }

        try {
            const addProjectRes = await this.projectService.addProject(body.project, body.userId);
            return res.status(HttpStatus.OK).json(addProjectRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Get(':id')
    async getProjectById(@Param() param: any, @Response() res: any) {
        try {
            const getProjectByIdRes = await this.projectService.getProjectById(param.id);
            return res.status(HttpStatus.OK).json(getProjectByIdRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Patch(':id')
    async updateProjectById(@Param() param: any, @Response() res: any, @Body() body: Project) {
        if (!(body && body.name && body.projectColorId)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Project name and projectColorId are required!' });
        }

        try {
            const updateProjectByIdRes = await this.projectService.updateProjectById(param.id, body);
            return res.status(HttpStatus.OK).json(updateProjectByIdRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Delete(':id')
    async deleteProjectById(@Param() param: any, @Response() res: any) {
        try {
            const deleteProjectByIdRes = await this.projectService.deleteProjectById(param.id);
            return res.status(HttpStatus.OK).json(deleteProjectByIdRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }
}
