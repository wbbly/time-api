import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Response,
    HttpStatus,
    Body,
    Headers,
    UseGuards,
    UnauthorizedException,
    UseInterceptors,
    UploadedFile,
    Delete,
    Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AxiosError } from 'axios';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

import { InvoiceService } from './invoice.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../core/mail/mail.service';

@Controller('invoice')
export class InvoiceController {
    constructor(
        private readonly invoiceService: InvoiceService,
        private readonly authService: AuthService,
        private readonly mailService: MailService
    ) {}

    @Post('add')
    @UseGuards(AuthGuard())
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './invoice_logo',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');

                    return cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
        })
    )
    async createInvoice(
        @Headers() headers: any,
        @Response() res: any,
        @Body()
        body: {
            vendorId: string;
            clientId: string;
            currency: string;
            comment: string;
            invoiceDate: Date;
            dueDate: Date;
            invoiceProjects: [];
        },
        @UploadedFile() file
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(body.vendorId && body.clientId && body.invoiceDate && body.dueDate && body.invoiceProjects && body.invoiceProjects.length)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            const invoiceRequest = {
                userId,
                vendorId: body.vendorId,
                clientId: body.clientId,
                currency: body.currency,
                comment: body.comment,
                invoiceDate: body.invoiceDate,
                dueDate: body.dueDate,
                invoiceProjects: body.invoiceProjects,
                logo: (file && file.path) || null,
            };
            await this.invoiceService.createInvoice(invoiceRequest);
            const invoiceList = await this.invoiceService.getInvoiceList(userId, { page: '1', limit: '10' });
            return res.status(HttpStatus.OK).json(invoiceList);
        } catch (e) {
            if (file && file.path) fs.unlinkSync(file.path);
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get('list')
    @UseGuards(AuthGuard())
    async getInvoices(
        @Headers() headers: any,
        @Response() res: any,
        @Query() query: { page?: string; limit?: string }
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (Object.keys(query).length) {
            const { page, limit } = query;
            if (!Number.parseInt(page) || !Number.parseInt(limit) || +page <= 0 || +limit <= 0) {
                return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
            }
        }

        try {
            const invoiceList = await this.invoiceService.getInvoiceList(userId, query);
            return res.status(HttpStatus.OK).json(invoiceList);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Patch(':id')
    @UseGuards(AuthGuard())
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './invoice_logo',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');

                    return cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
        })
    )
    async editInvoice(
        @Headers() headers: any,
        @Response() res: any,
        @Param() param: { id: string },
        @Body()
        body: {
            vendorId: string;
            clientId: string;
            currency: string;
            comment: string;
            invoiceDate: Date;
            dueDate: Date;
            invoiceProjects: [];
        },
        @UploadedFile() file
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (
            !(
                body.vendorId &&
                body.clientId &&
                body.invoiceDate &&
                body.dueDate &&
                body.invoiceProjects &&
                body.invoiceProjects.length
            )
        ) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        let invoice = null;
        try {
            invoice = await this.invoiceService.getInvoice(userId, param.id);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }

        const { invoice: invoiceResp } = invoice.data;

        const newInvoiceData: any = {
            invoiceId: param.id,
            userId,
            vendorId: body.vendorId,
            clientId: body.clientId,
            currency: body.currency,
            comment: body.comment,
            invoiceDate: body.invoiceDate,
            dueDate: body.dueDate,
            invoiceProjects: body.invoiceProjects,
            logo: file && file.path ? file.path : null,
        };

        const invoiceData = {
            invoiceId: invoiceResp.id,
            userId: invoiceResp.user_id,
            vendorId: invoiceResp.from.id,
            clientId: invoiceResp.to.id,
            currency: invoiceResp.currency,
            comment: invoiceResp.comment,
            invoiceDate: invoiceResp.invoice_date,
            dueDate: invoiceResp.due_date,
            invoiceProjects: invoiceResp.projects,
            logo: invoiceResp.logo,
        };

        Object.keys(invoiceData).forEach(prop => {
            const newValue = newInvoiceData[prop];
            invoiceData[prop] = typeof newValue === 'undefined' || newValue === null ? invoiceData[prop] : newValue;
        });

        try {
            await this.invoiceService.updateInvoice(invoiceData);
            if (file && file.path && invoice.data.invoice.logo) {
                fs.unlinkSync(invoice.data.invoice.logo);
            }
            const invoiceList = await this.invoiceService.getInvoiceList(userId, { page: '1', limit: '10' });
            return res.status(HttpStatus.OK).json(invoiceList);
        } catch (err) {
            if (file && file.path) fs.unlinkSync(file.path);
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Patch(':id/payment')
    @UseGuards(AuthGuard())
    async checkInvoicePayment(
        @Headers() headers: any,
        @Response() res: any,
        @Param() param: { id: string },
        @Body()
        body: {
            paymentStatus: boolean;
        }
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const paymentStatus = body.paymentStatus || false;
            await this.invoiceService.updatePaymentStatusInvoice(userId, param.id, paymentStatus);
            const invoiceList = await this.invoiceService.getInvoiceList(userId, { page: '1', limit: '10' });
            return res.status(HttpStatus.OK).json(invoiceList);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get(':id')
    @UseGuards(AuthGuard())
    async getInvoice(@Headers() headers: any, @Response() res: any, @Param() param: { id: string }) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            return res.status(HttpStatus.OK).json(await this.invoiceService.getInvoice(userId, param.id));
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Delete(':id')
    @UseGuards(AuthGuard())
    async deleteInvoice(@Headers() headers: any, @Response() res: any, @Param() param: { id: string }) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const delInvoice: any = await this.invoiceService.deleteInvoice(userId, param.id);
            if (delInvoice.logo) fs.unlinkSync(delInvoice.logo);

            const invoiceList = await this.invoiceService.getInvoiceList(userId, { page: '1', limit: '10' });
            return res.status(HttpStatus.OK).json(invoiceList);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Post(':id/sendInvoice')
    @UseGuards(AuthGuard())
    async sendInvoice(
        @Headers() headers: any,
        @Response() res: any,
        @Param() param: { id: string },
        @Body() body: { message: string }
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!body.message) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        let invoice = null;
        try {
            invoice = await this.invoiceService.getInvoice(userId, param.id);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }

        const { invoice: invoiceResp } = invoice.data;

        const subject = 'Invoice #' + invoiceResp.invoice_number + ' from - ' + invoiceResp.from.email;
        const { message: html } = body;
        const to = invoiceResp.to.email;

        this.mailService.send(to, subject, html);

        return res.status(HttpStatus.OK).json({ message: 'Email sent!' });
    }
}
