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
import { TimeOffDayService } from './time-off-day.service';

@Controller('resource-planing')
export class ResourcePlaningController {
    constructor(
        private readonly authService: AuthService,
        private readonly timeOffDayService: TimeOffDayService
    ) { }

    @Post('add')
    @UseGuards(AuthGuard())
    async createTimeOffDay(@Headers() headers: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const timeOffDay = await this.timeOffDayService.createTimeOffDay({
                createdById: body.createdById,
                timeOffType: body.timeOffType,
                teamId: body.teamId,
            });
            return res.status(HttpStatus.OK).json(timeOffDay);
        } catch (error) {
            console.log(error);
            return res
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'ERROR.TIME_OFF_DAY.CREATE_TIME_OFF_DAY_FAILED' });
        }
    }
}