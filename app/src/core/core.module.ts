import { Module, HttpModule } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';

import { HttpRequestsService } from './http-requests/http-requests.service';
import { MailService } from './mail/mail.service';

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
    providers: [HttpRequestsService, MailService],
    exports: [HttpRequestsService, MailService],
})
export class CoreModule {}
