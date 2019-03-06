import { Module } from '@nestjs/common';

import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { teamProviders } from './team.providers';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [TeamController],
    providers: [TeamService, ...teamProviders],
})
export class TeamModule {}
