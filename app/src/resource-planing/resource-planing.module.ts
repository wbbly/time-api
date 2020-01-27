import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { ResourcePlaningController } from './resource-planing.controller';
import { ResourcePlaningService } from './resource-planing.service';
import { UserModule } from '../user/user.module';
import { RoleCollaborationModule } from '../role-collaboration/role-collaboration.module';
import { TeamModule } from '../team/team.module';
import { TimeModule } from "../time/time.module";

@Module({
    imports: [CoreModule, AuthModule, UserModule, RoleCollaborationModule, TeamModule, TimeModule],
    controllers: [ResourcePlaningController],
    providers: [ResourcePlaningService],
    exports: [ResourcePlaningService],
})
export class ResourcePlaningModule {}
