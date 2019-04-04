import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimerCurrentV2Module } from '../timer-current-v2/timer-current-v2.module';
import { ScheduleService } from './schedule/schedule.service';

@Module({
    imports: [CoreModule, TimerCurrentV2Module],
    providers: [ScheduleService],
})
export class ScheduleModule {}
