import { Injectable } from '@nestjs/common';
import { MailerService } from '@nest-modules/mailer';

import { ConfigService } from '../config/config.service';

@Injectable()
export class MailService {
    mailerService: MailerService;

    constructor(private readonly configService: ConfigService) {}

    send(to: string, subject: string, text: string): void {
        this.createConnection()
            .sendMail({ to, subject, text })
            .then(res => {
                console.log(res);
            })
            .catch(err => {
                console.log(err);
            });
    }

    private createConnection(): MailerService {
        if (!(this.mailerService instanceof MailerService)) {
            this.mailerService = new MailerService({
                transport: `smtp://${this.configService.get('MAILER_USER')}:${this.configService.get(
                    'MAILER_PASSWORD'
                )}@${this.configService.get('MAILER_SMTP')}`,
                defaults: {
                    from: `"${this.configService.get('MAILER_SENDER_NAME')}" <${this.configService.get(
                        'MAILER_SENDER_EMAIL'
                    )}>`,
                },
            });
        }

        return this.mailerService;
    }
}
