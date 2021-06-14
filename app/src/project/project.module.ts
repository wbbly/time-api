import { forwardRef, Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimerModule } from '../timer/timer.module';
import { TimeModule } from '../time/time.module';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { TeamModule } from '../team/team.module';
import { UserModule } from '../user/user.module';
import { RoleCollaborationModule } from '../role-collaboration/role-collaboration.module';
import { ClientModule } from '../client/client.module';

@Module({
    imports: [
        CoreModule,
        TimerModule,
        TimeModule,
        TeamModule,
        RoleCollaborationModule,
        UserModule,
        forwardRef(() => ClientModule),
    ],
    controllers: [ProjectController],
    providers: [ProjectService],
    exports: [ProjectService],
})
export class ProjectModule {}
