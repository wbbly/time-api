import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { TimeModule } from '../time/time.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';

@Module({
    imports: [CoreModule, AuthModule, TimeModule, UserModule, ProjectModule],
    controllers: [SyncController],
    providers: [SyncService],
    exports: [SyncService],
})
export class SyncModule {}
