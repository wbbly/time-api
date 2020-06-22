import { Module, HttpModule } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';

import { HttpRequestsService } from './http-requests/http-requests.service';
import { MailService } from './mail/mail.service';
import { EncryptionService } from './encryption/encryption.service';
import { JiraAuthService } from './jira-auth/jira-auth.service';
import { JiraService } from './sync/jira/jira.service';

@Module({
    imports: [
        HttpModule,
        MailerModule.forRoot({
            transport: `smtp://${process.env.MAILER_USER}:${process.env.MAILER_PASSWORD}@${process.env.MAILER_SMTP}`,
            defaults: {
                from: `"${process.env.MAILER_SENDER_NAME}" <${process.env.MAILER_SENDER_EMAIL}>`,
            },
        }),
    ],
    providers: [HttpRequestsService, MailService, EncryptionService, JiraAuthService, JiraService],
    exports: [HttpRequestsService, MailService, EncryptionService, JiraAuthService, JiraService],
})
export class CoreModule {}
