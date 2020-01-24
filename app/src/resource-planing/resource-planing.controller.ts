import {
    Controller,
    Get,
    Response,
    HttpStatus,
    Query,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    Headers,
    UnauthorizedException,
    Delete,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth/auth.service';
import { ResourcePlaningService } from './resource-planing.service';

@Controller('resource-planing')
export class ResourcePlaningController {
    constructor(
        private readonly authService: AuthService,
        private readonly ResourcePlaningService: ResourcePlaningService
    ) {}
    @Post('add')
    @UseGuards(AuthGuard())
    async createPlanResource(@Headers() headers: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }
        let resource = null;
        try {
            resource = await this.ResourcePlaningService.createPlanResource({
                userId: body.userId,
                projectId: body.projectId,
                teamId: body.teamId,
                createdById: userId,
                totalDuration: body.totalDuration,
                startDate: body.startDate,
                endDate: body.endDate,
            });
        } catch (error) {
            console.log(error);
        }

        if (resource) {
            return res.status(HttpStatus.OK).json(resource);
        }

        return res
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: 'ERROR.PLAN_RESOURCE.CREATE_PLAN_RESOURCE_FAILED' });
    }

    @Patch(':id')
    @UseGuards(AuthGuard())
    async updatePlanResource(@Headers() headers: any, @Param() param: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        let resourceData = null;
        try {
            resourceData = await this.ResourcePlaningService.getResourceById(param.id);
        } catch (err) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'ERROR.PLAN_RESOURCE.UPDATE_PLAN_RESOURCE_FAILED' });
        }

        if (!resourceData) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'ERROR.PLAN_RESOURCE.UPDATE_PLAN_RESOURCE_FAILED' });
        }

        const newResourceData: any = {
            userId: body.userId,
            projectId: body.projectId,
            teamId: body.teamId,
            totalDuration: body.totalDuration,
            startDate: body.startDate,
            endDate: body.endDate,
            userTimeOffId: body.userTimeOffId,
            modifiedAt: body.modifiedAt,
        };

        resourceData = {
            userId: resourceData.user_id,
            projectId: resourceData.project_id,
            teamId: resourceData.team_id,
            totalDuration: resourceData.total_duration,
            startDate: resourceData.start_date,
            endDate: resourceData.end_date,
            userTimeOffId: resourceData.user_time_off_id,
            modifiedAt: body.modifiedAt,
        };

        Object.keys(resourceData).forEach(prop => {
            const newValue = newResourceData[prop];
            resourceData[prop] = typeof newValue === 'undefined' || newValue === null ? resourceData[prop] : newValue;
        });

        try {
            await this.ResourcePlaningService.updateResource(param.id, resourceData);

            let resourceUpdated = null;

            try {
                resourceUpdated = await this.ResourcePlaningService.getResourceById(param.id);
            } catch (err) {
                console.log(err);
            }

            if (!resourceUpdated) {
                return res
                    .status(HttpStatus.FORBIDDEN)
                    .json({ message: 'ERROR.PLAN_RESOURCE.UPDATE_PLAN_RESOURCE_FAILED' });
            }
            return res.status(HttpStatus.OK).json(resourceUpdated);
        } catch (err) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'ERROR.PLAN_RESOURCE.UPDATE_PLAN_RESOURCE_FAILED' });
        }
    }
    @Delete(':id')
    @UseGuards(AuthGuard())
    async deletePlanResource(@Headers() headers: any, @Param() param: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId || param.id !== userId) {
            throw new UnauthorizedException();
        }

        let deletedResourceById = null;
        try {
            deletedResourceById = await this.ResourcePlaningService.deleteResourceById(body.id, userId);
            return res.status(HttpStatus.OK).json(deletedResourceById);
        } catch (error) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'ERROR.PLAN_RESOURCE.DELETE_PLAN_RESOURCE_FAILED' });
        }
    }

    @Get('short-list')
    async shortListOfPlanResources(
        @Headers() headers: any,
        @Response() res: any,
        @Body() body: any
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        let resourceList = null;
        try {
            resourceList = await this.ResourcePlaningService.getShortResourceList(
                body.userId,
                body.startDate,
                body.endDate
            )
            
            return res.status(HttpStatus.OK).json(this.ResourcePlaningService.divideResourcesByWeeks(resourceList.data.plan_resource));
        } catch (error) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'ERROR.PLAN_RESOURCE.SHORT_PLAN_RESOURCE_LIST_FAILED' });
        }
    }

    @Get('full-list')
    async fullListOfPlanResources(
        @Headers() headers: any,
        @Response() res: any,
        @Body() body: any
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        let resourceList = null;
        try {
            resourceList = await this.ResourcePlaningService.getFullResourceList(
                body.userId,
                body.startDate,
                body.endDate
            )
            return res.status(HttpStatus.OK).json(this.ResourcePlaningService.divideResourcesByWeeksAndProject(resourceList.data.plan_resource, body.startDate, body.endDate));
        } catch (error) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'ERROR.PLAN_RESOURCE.SHORT_PLAN_RESOURCE_LIST_FAILED' });
        }
    }
}
