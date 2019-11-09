import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { SocialService } from './social.service';

@Module({
    imports: [CoreModule, AuthModule],
    providers: [SocialService],
    exports: [SocialService],
})
export class SocialModule {}
