import { Module } from '@nestjs/common';

import { RoleCollaborationController } from './role-collaboration.controller';
import { RoleCollaborationService } from './role-collaboration.service';

@Module({
    controllers: [RoleCollaborationController],
    providers: [RoleCollaborationService],
    exports: [RoleCollaborationService],
})
export class RoleCollaborationModule {}
