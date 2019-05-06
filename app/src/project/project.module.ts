import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimerModule } from '../timer/timer.module';
import { TimeModule } from '../time/time.module';
import { TeamModule } from '../team/team.module';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
    imports: [CoreModule, TimerModule, TimeModule, TeamModule],
    controllers: [ProjectController],
    providers: [ProjectService],
})
export class ProjectModule {}
