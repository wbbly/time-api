import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimeModule } from '../time/time.module';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
    imports: [CoreModule, TimeModule],
    controllers: [ProjectController],
    providers: [ProjectService],
})
export class ProjectModule {}
