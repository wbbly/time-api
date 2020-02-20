import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimerOffService } from './timer-off.service';
import { TimerOffController } from './timer-off.controller';
import { TeamModule } from '../team/team.module';
import { RoleCollaborationModule } from '../role-collaboration/role-collaboration.module';

@Module({
    imports: [CoreModule, TeamModule, RoleCollaborationModule],
    controllers: [TimerOffController],
    providers: [TimerOffService],
    exports: [TimerOffService],
})
export class TimerOffModule {}
