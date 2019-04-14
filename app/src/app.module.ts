import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectModule } from './project/project.module';
import { ProjectColorModule } from './project-color/project-color.module';
import { RoleModule } from './role/role.module';
import { TimeModule } from './time/time.module';
import { TimerModule } from './timer/timer.module';
import { TimerCurrentV2Module } from './timer-current-v2/timer-current-v2.module';
import { UserModule } from './user/user.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
    imports: [
        ProjectModule,
        ProjectColorModule,
        RoleModule,
        TimeModule,
        TimerModule,
        TimerCurrentV2Module,
        UserModule,
        ScheduleModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
