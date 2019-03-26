import { Module, HttpModule } from '@nestjs/common';

import { ProjectColorController } from './project-color.controller';
import { ProjectColorService } from './project-color.service';

@Module({
    imports: [HttpModule],
    controllers: [ProjectColorController],
    providers: [ProjectColorService],
})
export class ProjectColorModule {}
