import { Controller, Get, Patch, Delete, Param, Response, HttpStatus, Body, Query } from '@nestjs/common';
import { AxiosError } from 'axios';

import { TimerService } from './timer.service';
import { Timer } from './interfaces/timer.interface';

@Controller('timer')
export class TimerController {
    constructor(private readonly timerService: TimerService) {}

    @Get('user-list')
    async userTimerList(@Response() res: any, @Query() params) {
        if (!(params && params.userId)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameter userId is required!' });
        }

        try {
            const userTimerListRes = await this.timerService.getUserTimerList(params.userId);
            return res.status(HttpStatus.OK).json(userTimerListRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Get('reports-list')
    async reportsTimerList(@Response() res: any, @Query() params) {
        if (!(params && params.userEmails && params.startDate && params.endDate)) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'Parameters userEmails, startDate and endDate are required!' });
        }

        if (params && params.userEmails && Object.prototype.toString.call(params.userEmails) !== '[object Array]') {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameters userEmails needs to be an array!' });
        }

        if (params && params.projectNames && Object.prototype.toString.call(params.projectNames) !== '[object Array]') {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameters projectNames needs to be an array!' });
        }

        try {
            const userTimerListRes = await this.timerService.getReportsTimerList(
                params.userEmails,
                params.projectNames || [],
                params.startDate,
                params.endDate
            );
            return res.status(HttpStatus.OK).json(userTimerListRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Patch(':id')
    async updateTimerById(@Param() param: any, @Response() res: any, @Body() body: Timer) {
        if (!(body && body.issue && body.projectId && body.startDatetime && body.endDatetime)) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'Timer issue, projectId, startDatetime and endDatetime are required!' });
        }

        try {
            const updateTimerByIdRes = await this.timerService.updateTimerById(param.id, body);
            return res.status(HttpStatus.OK).json(updateTimerByIdRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Delete(':id')
    async deleteTimerById(@Param() param: any, @Response() res: any) {
        try {
            const deleteTimerByIdRes = await this.timerService.deleteTimerById(param.id);
            return res.status(HttpStatus.OK).json(deleteTimerByIdRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }
}
