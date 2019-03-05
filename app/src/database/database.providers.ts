import { Sequelize } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Timer } from '../timer/timer.entity';
import { Team } from '../team/team.entity';
import { Project } from '../project/project.entity';
import { UserProject } from 'src/user/user.project.entity';
import { TeamProject } from 'src/team/team.project.entity';
import { TeamUser } from 'src/team/team.user.entity';

export const databaseProviders = [
    {
        provide: 'SequelizeToken',
        useFactory: async () => {
            const sequelize = new Sequelize({
                dialect: 'mysql',
                host: 'localhost',
                port: 3306,
                username: 'root',
                password: '',
                database: 'lazy',
            });
            sequelize.addModels([User, Timer, Team, Project, UserProject, TeamProject, TeamUser]);
            await sequelize.sync();
            return sequelize;
        },
    },
];
