import { forwardRef, Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { TeamModule } from '../team/team.module';
import { RoleCollaborationModule } from '../role-collaboration/role-collaboration.module';
import { ProjectModule } from '../project/project.module';

@Module({
    imports: [CoreModule, TeamModule, RoleCollaborationModule, forwardRef(() => ProjectModule)],
    controllers: [ClientController],
    providers: [ClientService],
    exports: [ClientService],
})
export class ClientModule {}
