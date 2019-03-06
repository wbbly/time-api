import { Team } from './team.entity';

export const teamProviders = [
    {
        provide: 'TeamRepository',
        useValue: Team,
    },
];
