import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimeModule } from '../time/time.module';
import { TimerCurrentGateway } from './timer-current.gateway';
import { TimerCurrentService } from './timer-current.service';

@Module({
    imports: [CoreModule, TimeModule],
    providers: [TimerCurrentGateway, TimerCurrentService],
})
export class TimerCurrentModule {}
