import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimerModule } from '../timer/timer.module';
import { TimerCurrentV2Gateway } from './timer-current-v2.gateway';
import { TimerCurrentV2Service } from './timer-current-v2.service';

@Module({
    imports: [CoreModule, TimerModule],
    providers: [TimerCurrentV2Gateway, TimerCurrentV2Service],
})
export class TimerCurrentV2Module {}
