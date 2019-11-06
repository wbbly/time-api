import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { TeamModule } from '../team/team.module';
import { RoleCollaborationModule } from '../role-collaboration/role-collaboration.module';

@Module({
    imports: [CoreModule, TeamModule, RoleCollaborationModule],
    controllers: [ClientController],
    providers: [ClientService],
    exports: [ClientService],
})
export class ClientModule {}
