import { Module, HttpModule } from '@nestjs/common';
import { MailerModule } from '@nest-modules/mailer';

import { HttpRequestsService } from './http-requests/http-requests.service';
import { ConfigService } from './config/config.service';
import { MailService } from './mail/mail.service';

@Module({
    imports: [HttpModule, MailerModule.forRoot()],
    providers: [
        HttpRequestsService,
        MailService,
        {
            provide: ConfigService,
            useValue: new ConfigService('.env'),
        },
    ],
    exports: [HttpRequestsService, MailService, ConfigService],
})
export class CoreModule {}
