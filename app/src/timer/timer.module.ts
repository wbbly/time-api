import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimeModule } from '../time/time.module';
import { TeamModule } from 'src/team/team.module';
import { TimerController } from './timer.controller';
import { TimerService } from './timer.service';

@Module({
    imports: [CoreModule, TimeModule, TeamModule],
    controllers: [TimerController],
    providers: [TimerService],
    exports: [TimerService],
})
export class TimerModule {}
