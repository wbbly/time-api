import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimerCurrentGateway } from './timer-current.gateway';
import { TimerCurrentService } from './timer-current.service';

@Module({
    imports: [CoreModule],
    providers: [TimerCurrentGateway, TimerCurrentService],
})
export class TimerCurrentModule {}
