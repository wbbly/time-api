import { Controller, Get, Response, HttpStatus, UseGuards, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { TimeService } from './time.service';
import { Time } from './interfaces/time.interface';

@Controller('time')
export class TimeController {
    constructor(private readonly timeService: TimeService) {}

    @Get('current')
    @UseGuards(AuthGuard())
    async timeCurrent(@Headers() headers: any, @Response() res: any) {
        const time: Time = { timeISO: this.timeService.getISOTime() };

        return res.status(HttpStatus.OK).json(time);
    }
}
