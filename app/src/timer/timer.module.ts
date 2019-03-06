import { Module } from '@nestjs/common';

import { TimerController } from './timer.controller';
import { TimerService } from './timer.service';
import { timerProviders } from './timer.providers';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [TimerController],
    providers: [TimerService, ...timerProviders],
})
export class TimerModule {}
