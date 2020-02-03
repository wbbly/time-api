import {
    Controller,
    Response,
    HttpStatus,
    Post,
    Body,
    UseGuards,
    Headers,
    UnauthorizedException,
    Delete
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth/auth.service';
import { TimeOffDayService } from './time-off-day.service';

@Controller('time-off-day')
export class TimeOffDayController {
    constructor(private readonly authService: AuthService, private readonly timeOffDayService: TimeOffDayService) {}

    @Post('add')
    @UseGuards(AuthGuard())
    async createTimeOffDay(@Headers() headers: any, @Response() res: any, @Body() body: any) {
        const createdById = await this.authService.getVerifiedUserId(headers.authorization);
        if (!createdById) {
            throw new UnauthorizedException();
        }

        if (!(body.timeOffType)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            const timeOffDay = await this.timeOffDayService.createTimeOffDay({
                createdById: createdById,
                timeOffType: body.timeOffType
            });

            return res.status(HttpStatus.OK).json(timeOffDay);
        } catch (error) {
            
            return res
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'ERROR.TIME_OFF_DAY.CREATE_TIME_OFF_DAY_FAILED' });
        }
    }

    @Delete()
    @UseGuards(AuthGuard())
    async deletePlanResource(@Headers() headers: any, @Response() res: any, @Body() body: any) {
        if (!(body.timeOffDayId)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const deletedTimeOffDayById = await this.timeOffDayService.deleteTimeOffDayById(body.timeOffDayId, userId);
            
            return res.status(HttpStatus.OK).json(deletedTimeOffDayById);
        } catch (error) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.TIME_OFF_DAY.DELETE_TIME_OFF_DAY_FAILED' });
        }
    }
}
