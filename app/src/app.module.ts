import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { AppController } from './app.controller';
import { UserController } from './user/user.controller';
import { TimerController } from './timer/timer.controller';
import { ProjectController } from './project/project.controller';
import { TeamController } from './team/team.controller';
import { AppService } from './app.service';
import { ProjectService } from './project/project.service';
import { UserService } from './user/user.service';
import { TimerService } from './timer/timer.service';
import { TeamService } from './team/team.service';
import { ProjectModule } from './project/project.module';
import { UserModule } from './user/user.module';
import { TimerModule } from './timer/timer.module';
import { TeamModule } from './team/team.module';

@Module({
    imports: [
        GraphQLModule.forRoot({
            typePaths: ['./**/*.graphql'],
        }),
        UserModule,
        TimerModule,
        ProjectModule,
        TeamModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
