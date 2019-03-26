import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectModule } from './project/project.module';
import { ProjectColorModule } from './project-color/project-color.module';
import { RoleModule } from './role/role.module';
import { TimerModule } from './timer/timer.module';
import { TimerCurrentModule } from './timer-current/timer-current.module';
import { TimerCurrentV2Module } from './timer-current-v2/timer-current-v2.module';
import { UserModule } from './user/user.module';

@Module({
    imports: [
        ProjectModule,
        ProjectColorModule,
        RoleModule,
        TimerModule,
        TimerCurrentModule,
        TimerCurrentV2Module,
        UserModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
