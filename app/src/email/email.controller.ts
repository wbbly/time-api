import { Controller, Post, HttpStatus, Response, Body } from '@nestjs/common';

import { MailService } from '../core/mail/mail.service';

@Controller('email')
export class EmailController {
    constructor(private readonly mailService: MailService) {}

    @Post('send')
    async sendEmail(@Response() res: any, @Body() body: any) {
        if (!(body.email && body.company && body.message)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email, company and message are required!' });
        }

        const to = process.env.MAILER_SENDER_EMAIL;
        const subject = 'Hey! This is a "Try Wobbly request" from Lainding page contact form!';
        const html = `
            Company name: ${body.company}
            <br /><br />
            Email: ${body.email}
            <br /><br />
            Message: ${body.message}
            <br /><br />
            <a href="${process.env.APP_URL}">Wobbly</a>
            <br />
            © 2020 All rights reserved.
        `;
        this.mailService.send(to, subject, html);

        return res.status(HttpStatus.OK).json({ message: 'Email sent!' });
    }

    @Post('send-alert')
    async sendAlertEmail(@Response() res: any, @Body() body: any) {
        if (!body.message) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Message are required!' });
        }

        const to = process.env.MAILER_MANAGER_EMAIL;
        const subject = 'Alert from Wobbly!';
        const html = `
            Message: ${body.message}
            <br /><br />
            <a href="${process.env.APP_URL}">Wobbly</a>
            <br />
            © 2020 All rights reserved.
        `;
        this.mailService.send(to, subject, html);

        return res.status(HttpStatus.OK).json({ message: 'Email sent!' });
    }
}
