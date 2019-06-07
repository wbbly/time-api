import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { RoleCollaborationModule } from '../role-collaboration/role-collaboration.module';
import { ProjectColorModule } from '../project-color/project-color.module';

import { TeamController } from './team.controller';
import { TeamService } from './team.service';

@Module({
    imports: [CoreModule, AuthModule, RoleCollaborationModule, ProjectColorModule],
    controllers: [TeamController],
    providers: [TeamService],
    exports: [TeamService],
})
export class TeamModule {}
