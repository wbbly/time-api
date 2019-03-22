import { Inject, Injectable } from '@nestjs/common';

import { TeamDTO } from './team.dto';
import { Team } from './team.entity';

@Injectable()
export class TeamService {
    constructor(@Inject('TeamRepository') private readonly teamRepository: typeof Team) {}

    async findAll(): Promise<Team[]> {
        return await this.teamRepository.findAll<Team>();
    }
}
