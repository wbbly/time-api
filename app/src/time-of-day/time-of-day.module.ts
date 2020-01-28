import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimeOffDayService } from "./time-off-day.service";
import { TimeOffDayController } from "./time-off-day.controller";
import { TeamModule } from "../team/team.module";
import { RoleCollaborationModule } from "../role-collaboration/role-collaboration.module";

@Module({
    imports: [CoreModule, TeamModule, RoleCollaborationModule],
    controllers: [TimeOffDayController],
    providers: [TimeOffDayService],
    exports: [TimeOfDayModule],
})
export class TimeOfDayModule {}
