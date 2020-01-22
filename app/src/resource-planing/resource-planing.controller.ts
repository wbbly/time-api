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
    async currentUserResources(@Headers() headers: any, @Response() res: any, @Body() body: any) {
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
}
