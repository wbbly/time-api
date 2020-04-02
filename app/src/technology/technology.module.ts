import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { TechnologyController } from './technology.controller';
import { TechnologyService } from './technology.service';

@Module({
    imports: [CoreModule, AuthModule],
    controllers: [TechnologyController],
    providers: [TechnologyService],
    exports: [TechnologyService],
})
export class TechnologyModule {}
