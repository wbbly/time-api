import { Module, HttpModule } from '@nestjs/common';

import { TeamController } from './team.controller';
import { TeamService } from './team.service';

@Module({
    imports: [HttpModule],
    controllers: [TeamController],
    providers: [TeamService],
    exports: [TeamService],
})
export class TeamModule {}
