import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimeOffDayService } from "./time-off-day.service";

@Module({
    imports: [CoreModule],
    providers: [TimeOffDayService],
    exports: [TimeOfDayModule],
})
export class TimeOfDayModule {}
