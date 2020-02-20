import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { TimerPlanningController } from './timer-planning.controller';
import { TimerPlanningService } from './timer-planning.service';
import { UserModule } from '../user/user.module';
import { RoleCollaborationModule } from '../role-collaboration/role-collaboration.module';
import { TeamModule } from '../team/team.module';
import { TimeModule } from '../time/time.module';

@Module({
    imports: [CoreModule, AuthModule, UserModule, RoleCollaborationModule, TeamModule, TimeModule],
    controllers: [TimerPlanningController],
    providers: [TimerPlanningService],
    exports: [TimerPlanningService],
})
export class TimerPlanningModule {}
