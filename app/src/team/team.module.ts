import { Module } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { DatabaseModule } from '../database/database.module';
import { teamProviders } from './team.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [TeamController],
  providers: [TeamService, ...teamProviders],
})
export class TeamModule { }
