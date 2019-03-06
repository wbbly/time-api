import { Project } from './project.entity';

export const projectProviders = [
    {
        provide: 'ProjectRepository',
        useValue: Project,
    },
];
