import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimerController } from './timer.controller';
import { TimerService } from './timer.service';

@Module({
    imports: [CoreModule],
    controllers: [TimerController],
    providers: [TimerService],
    exports: [TimerService],
})
export class TimerModule {}
