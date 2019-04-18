import { Controller, Post, HttpStatus, Response, Body } from '@nestjs/common';

import { MailService } from '../core/mail/mail.service';
import { ConfigService } from 'src/core/config/config.service';

@Controller('email')
export class EmailController {
    constructor(private readonly mailService: MailService, private readonly configService: ConfigService) {}

    @Post('send')
    async loginUser(@Response() res: any, @Body() body: any) {
        if (!(body && body.email && body.company && body.message)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email, company and message are required!' });
        }

        const to = this.configService.get('MAILER_SENDER_EMAIL');
        const subject = 'Hey! This is a "Try Wobbly request" from Lainding page contact form!';
        const html = `
            Company name: ${body.company}
            <br /><br />
            Email: ${body.email}
            <br /><br />
            Message: ${body.message}
        `;
        this.mailService.send(to, subject, html);

        return res.status(HttpStatus.OK).json({ message: 'Email sent!' });
    }
}
