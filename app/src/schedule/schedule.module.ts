import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimerCurrentV2Module } from '../timer-current-v2/timer-current-v2.module';
import { TimeModule } from '../time/time.module';
import { ScheduleService } from './schedule.service';
import { InvoiceModule } from '../invoice/invoice.module';

@Module({
    imports: [CoreModule, TimerCurrentV2Module, TimeModule, InvoiceModule],
    providers: [ScheduleService],
})
export class ScheduleModule {}
