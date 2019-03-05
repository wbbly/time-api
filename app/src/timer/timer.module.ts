import { Module } from '@nestjs/common';
import { TimerController } from './timer.controller';
import { TimerService } from './timer.service';
import { DatabaseModule } from '../database/database.module';
import { timerProviders } from './timer.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [TimerController],
  providers: [TimerService, ...timerProviders],
})
export class TimerModule { }
