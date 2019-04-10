import { Controller, Get, Response, HttpStatus } from '@nestjs/common';

import { TimeService } from './time.service';
import { Time } from './interfaces/time.interface';

@Controller('time')
export class TimeController {
    constructor(private readonly timeService: TimeService) {}

    @Get('current')
    async loginUser(@Response() res: any) {
        const time: Time = { timeISO: this.timeService.getISOTime() };

        return res.status(HttpStatus.OK).json(time);
    }
}
