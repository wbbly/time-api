import { Module, HttpModule } from '@nestjs/common';

import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
    imports: [HttpModule],
    controllers: [ProjectController],
    providers: [ProjectService],
})
export class ProjectModule {}
