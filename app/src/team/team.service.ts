import { Injectable } from '@nestjs/common';

@Injectable()
export class TeamService {
    DEFAULT_TEAMS = {
        DEFAULT: 'default',
    };

    DEFAULT_TEAMS_IDS = {
        DEFAULT: '00000000-0000-0000-0000-000000000000',
    };

    constructor() {}
}
