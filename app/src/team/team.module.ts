import { Module, HttpModule } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { RoleCollaborationModule } from '../role-collaboration/role-collaboration.module';

import { TeamController } from './team.controller';
import { TeamService } from './team.service';

@Module({
    imports: [HttpModule, CoreModule, RoleCollaborationModule],
    controllers: [TeamController],
    providers: [TeamService],
    exports: [TeamService],
})
export class TeamModule {}
