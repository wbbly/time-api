import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { RoleModule } from '../role/role.module';
import { RoleCollaborationModule } from '../role-collaboration/role-collaboration.module';
import { TeamModule } from '../team/team.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    imports: [CoreModule, RoleModule, RoleCollaborationModule, TeamModule],
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule {}
