import { Component, Inject, Injectable } from '@nestjs/common';

import { TimerDTO } from './timer.dto';
import { Timer } from './timer.entity';

@Injectable()
export class TimerService {
    constructor(@Inject('TimerRepository') private readonly timerRepository: typeof Timer) {}

    async findAll(): Promise<Timer[]> {
        return await this.timerRepository.findAll<Timer>();
    }
}
