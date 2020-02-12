import {
    Controller,
    Response,
    HttpStatus,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    Headers,
    UnauthorizedException,
    Delete,
    Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from '../auth/auth.service';
import { ResourcePlaningService } from './resource-planing.service';

@Controller('resource-planing')
export class ResourcePlaningController {
    constructor(
        private readonly authService: AuthService,
        private readonly resourcePlaningService: ResourcePlaningService
    ) {}

    @Post('add')
    @UseGuards(AuthGuard())
    async addPlanResource(@Headers() headers: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (
            !(
                body.userId &&
                body.projectId &&
                body.userTimeOffId &&
                body.totalDuration &&
                body.startDate &&
                body.endDate
            )
        ) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            return res.status(HttpStatus.OK).json(
                await this.resourcePlaningService.createResource({
                    userId: body.userId,
                    projectId: body.projectId,
                    userTimeOffId: body.userTimeOffId,
                    totalDuration: body.totalDuration,
                    startDate: body.startDate,
                    endDate: body.endDate,
                    createdById: userId,
                })
            );
        } catch (error) {
            return res
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'ERROR.PLAN_RESOURCE.CREATE_PLAN_RESOURCE_FAILED' });
        }
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
            resourceData = await this.resourcePlaningService.getResourceById(param.id);

            if (!resourceData) {
                throw new Error();
            }
        } catch (err) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'ERROR.PLAN_RESOURCE.UPDATE_PLAN_RESOURCE_FAILED' });
        }

        const newResourceData: any = {
            userId: body.userId,
            projectId: body.projectId,
            userTimeOffId: body.userTimeOffId,
            totalDuration: body.totalDuration,
            startDate: body.startDate,
            endDate: body.endDate,
        };

        resourceData = {
            userId: resourceData.user_id,
            projectId: resourceData.project_id,
            userTimeOffId: resourceData.user_time_off_id,
            totalDuration: resourceData.total_duration,
            startDate: resourceData.start_date,
            endDate: resourceData.end_date,
        };

        Object.keys(resourceData).forEach(prop => {
            const newValue = newResourceData[prop];
            resourceData[prop] = typeof newValue === 'undefined' || newValue === null ? resourceData[prop] : newValue;
        });

        try {
            return res
                .status(HttpStatus.OK)
                .json(await this.resourcePlaningService.updateResource(param.id, resourceData, userId));
        } catch (err) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'ERROR.PLAN_RESOURCE.UPDATE_PLAN_RESOURCE_FAILED' });
        }
    }

    @Get('list')
    @UseGuards(AuthGuard())
    async getPlanResourcesList(@Headers() headers: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(body.userIds && body.startDate && body.endDate)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            return res
                .status(HttpStatus.OK)
                .json(await this.resourcePlaningService.getResourceList(body.userIds, body.startDate, body.endDate));
        } catch (error) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'ERROR.PLAN_RESOURCE.SHORT_PLAN_RESOURCE_LIST_FAILED' });
        }
    }

    @Delete()
    @UseGuards(AuthGuard())
    async deletePlanResource(@Headers() headers: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            return res
                .status(HttpStatus.OK)
                .json(await this.resourcePlaningService.deleteResourceById(body.resourceId, userId));
        } catch (error) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'ERROR.PLAN_RESOURCE.DELETE_PLAN_RESOURCE_FAILED' });
        }
    }

    @Get('full-list')
    @UseGuards(AuthGuard())
    async getPlanResourcesFullList(@Headers() headers: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(body.userIds && body.startDate && body.endDate)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            return res
                .status(HttpStatus.OK)
                .json(
                    await this.resourcePlaningService.getFullResourceList(body.userIds, body.startDate, body.endDate)
                );
        } catch (error) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'ERROR.PLAN_RESOURCE.SHORT_PLAN_RESOURCE_LIST_FAILED' });
        }
    }
}
