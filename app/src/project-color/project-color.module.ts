import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { ProjectColorController } from './project-color.controller';
import { ProjectColorService } from './project-color.service';

@Module({
    imports: [CoreModule],
    controllers: [ProjectColorController],
    providers: [ProjectColorService],
})
export class ProjectColorModule {}
