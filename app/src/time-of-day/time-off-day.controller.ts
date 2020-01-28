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

        try {
            const timeOffDay = await this.timeOffDayService.createTimeOffDay({
                createdById: createdById,
                timeOffType: body.timeOffType,
                isActive: body.isActive,
            });
            return res.status(HttpStatus.OK).json(timeOffDay);
        } catch (error) {
            return res
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'ERROR.TIME_OFF_DAY.CREATE_TIME_OFF_DAY_FAILED' });
        }
    }

    @Patch(':id')
    @UseGuards(AuthGuard())
    async updatePlanResource(@Headers() headers: any, @Param() param: any, @Response() res: any, @Body() body: any) {
        const updatedById = await this.authService.getVerifiedUserId(headers.authorization);
        if (!updatedById) {
            throw new UnauthorizedException();
        }

        let timeOffDayData = null;
        try {
            timeOffDayData = await this.timeOffDayService.getTimeOffDayById(param.id);
        } catch (err) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.TIME_OFF_DAY.CREATE_TIME_OFF_DAY_FAILED' });
        }

        if (!timeOffDayData) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.TIME_OFF_DAY.CREATE_TIME_OFF_DAY_FAILED' });
        }

        const newTimeOffDayData: any = {
            timeOffType: body.timeOffType,
            isActive: body.isActive,
        };

        timeOffDayData = {
            timeOffType: timeOffDayData.time_off_type,
            isActive: timeOffDayData.is_active,
        };

        Object.keys(timeOffDayData).forEach(prop => {
            const newValue = newTimeOffDayData[prop];
            timeOffDayData[prop] =
                typeof newValue === 'undefined' || newValue === null ? timeOffDayData[prop] : newValue;
        });

        try {
            const timeOffDataUpdated = await this.timeOffDayService.updateTimeOffDay(
                param.id,
                timeOffDayData,
                updatedById
            );

            return res.status(HttpStatus.OK).json(timeOffDataUpdated);
        } catch (err) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.TIME_OFF_DAY.UPDATE_TIME_OFF_DAY_FAILED' });
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
            const deletedTimeOffDayById = await this.timeOffDayService.deleteTimeOffDayById(body.timeOffDayId, userId);
            return res.status(HttpStatus.OK).json(deletedTimeOffDayById);
        } catch (error) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.TIME_OFF_DAY.DELETE_TIME_OFF_DAY_FAILED' });
        }
    }

    @Get('list')
    @UseGuards(AuthGuard())
    async getTimeOffDayList(@Headers() headers: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const timeOffDayList = await this.timeOffDayService.getTimeOffDayList(userId);
            return res.status(HttpStatus.OK).json(timeOffDayList);
        } catch (error) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.TIME_OFF_DAY.LIST_TIME_OFF_DAY_FAILED' });
        }
    }
}
