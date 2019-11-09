import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectModule } from './project/project.module';
import { ProjectColorModule } from './project-color/project-color.module';
import { RoleCollaborationModule } from './role-collaboration/role-collaboration.module';
import { TimeModule } from './time/time.module';
import { TimerModule } from './timer/timer.module';
import { TimerCurrentV2Module } from './timer-current-v2/timer-current-v2.module';
import { UserModule } from './user/user.module';
import { ScheduleModule } from './schedule/schedule.module';
import { EmailModule } from './email/email.module';
import { ReportModule } from './report/report.module';
import { FileModule } from './file/file.module';
import { TeamModule } from './team/team.module';
import { SyncModule } from './sync/sync.module';
import { ClientModule } from './client/client.module';
import { SocialModule } from './social/social.module';

@Module({
    imports: [
        ProjectModule,
        ProjectColorModule,
        RoleCollaborationModule,
        TimeModule,
        TimerModule,
        TimerCurrentV2Module,
        UserModule,
        ScheduleModule,
        EmailModule,
        ReportModule,
        FileModule,
        TeamModule,
        SyncModule,
        ClientModule,
        SocialModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
