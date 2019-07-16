import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { TimeModule } from '../time/time.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
    imports: [CoreModule, AuthModule, TimeModule],
    controllers: [SyncController],
    providers: [SyncService],
    exports: [SyncService],
})
export class SyncModule {}
