import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { RoleCollaborationModule } from '../role-collaboration/role-collaboration.module';
import { TeamModule } from '../team/team.module';
import { SocialModule } from '../social/social.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    imports: [CoreModule, AuthModule, RoleCollaborationModule, TeamModule, SocialModule],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
