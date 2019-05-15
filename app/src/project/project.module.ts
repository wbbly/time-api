import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimerModule } from '../timer/timer.module';
import { TimeModule } from '../time/time.module';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { TeamModule } from '../team/team.module';

@Module({
    imports: [CoreModule, TimerModule, TimeModule, TeamModule],
    controllers: [ProjectController],
    providers: [ProjectService],
    exports: [ProjectService],
})
export class ProjectModule {}
