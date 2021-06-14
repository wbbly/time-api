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
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AxiosError, AxiosResponse } from 'axios';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { Invoice } from './interfaces/invoice.interface';

import { InvoiceService } from './invoice.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../core/mail/mail.service';
import { TeamService } from '../team/team.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { UserService } from '../user/user.service';

@Controller('invoice')
export class InvoiceController {
    constructor(
        private readonly invoiceService: InvoiceService,
        private readonly authService: AuthService,
        private readonly mailService: MailService,
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly userService: UserService
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
            invoiceProjects: Invoice[];
            invoiceVendor: any;
            timezoneOffset: number;
            originalLogo?: string;
            invoiceNumber?: string;
            discount?: number;
            reference?: string;
        },
        @UploadedFile() file
    ) {
        const userId: string = await this.authService.getVerifiedUserId(headers.authorization);
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
                body.invoiceProjects.length &&
                body.timezoneOffset
            )
        ) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        if (!body.invoiceVendor.company_name)
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.CHECK_REQUEST_PARAMS(COMPANY_MISSING)' });

        if (body.invoiceNumber.length > 15)
            return res
                .status(HttpStatus.BAD_REQUEST)
                .json({ message: 'ERROR.CHECK_REQUEST_PARAMS(INVOICE_NUM_15_SYMBOL_LIMIT)' });

        let newFileLogo: string = null;
        try {
            if (body.originalLogo && fs.existsSync(body.originalLogo)) {
                const randomName = Array(32)
                    .fill(null)
                    .map(() => Math.round(Math.random() * 16).toString(16))
                    .join('');

                const fileName = `${randomName}${extname(body.originalLogo)}`;

                newFileLogo = `invoice_logo/${fileName}`;

                fs.copyFileSync(body.originalLogo, './' + newFileLogo);
            }

            const invoiceRequest = {
                userId,
                vendorId: body.vendorId,
                clientId: body.clientId,
                currency: body.currency,
                comment: body.comment,
                invoiceDate: body.invoiceDate,
                dueDate: body.dueDate,
                invoiceProjects: body.invoiceProjects,
                invoiceVendor: body.invoiceVendor,
                invoiceNumber: body.invoiceNumber,
                timezoneOffset: body.timezoneOffset,
                logo: file && file.path ? file.path : newFileLogo ? newFileLogo : null,
                discount: body.discount,
                reference: body.reference,
            };

            const invoice = await this.invoiceService.createInvoice(invoiceRequest);
            return res.status(HttpStatus.OK).json(invoice.data.insert_invoice.returning[0]);
        } catch (e) {
            if (file && file.path) fs.unlinkSync(file.path);
            if (newFileLogo) fs.unlinkSync(newFileLogo);
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get('list')
    @UseGuards(AuthGuard())
    async getInvoices(
        @Headers() headers: any,
        @Response() res: any,
        @Query() query: { page?: string; limit?: string; search?: string; status?: string }
    ) {
        const userId: string = await this.authService.getVerifiedUserId(headers.authorization);
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

    @Get('total')
    @UseGuards(AuthGuard())
    async getTotal(
        @Headers() headers: any,
        @Response() res: any,
        @Query() query: { search?: string; status?: string }
    ) {
        const userId: string = await this.authService.getVerifiedUserId(headers.authorization);

        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const invoiceList = await this.invoiceService.getGrandTotal(userId, query);

            return res.status(HttpStatus.OK).json(invoiceList);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get('total-by-status')
    @UseGuards(AuthGuard())
    async getTotalByStatus(@Headers() headers: any, @Response() res: any, @Query() query: { search?: string }) {
        const userId: string = await this.authService.getVerifiedUserId(headers.authorization);

        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const invoiceTotalByStatusResponse = await this.invoiceService.getTotalByStatus(userId);

            return res.status(HttpStatus.OK).json(invoiceTotalByStatusResponse);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get(':id/pdf')
    async getPdfFile(@Response() res: any, @Param() param: { id: string }) {
        let invoice: Invoice = null;
        try {
            invoice = await this.invoiceService.getInvoice(param.id);
        } catch (error) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'CHECK_REQUEST_PARAMS' });
        }
        try {
            const pdfDoc = await this.invoiceService.getPdfDocument(invoice);

            // res.setHeader('Content-Length',  stat.size);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
            pdfDoc.pipe(
                res,
                'utf8'
            );
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'INTERNAL_SERVER_ERROR' });
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
            invoiceVendor: any;
            test: string;
            removeFile: boolean;
            invoiceNumber: string;
            timezoneOffset: number;
            discount?: number;
            reference?: string;
        },
        @UploadedFile() file
    ) {
        const userId: string = await this.authService.getVerifiedUserId(headers.authorization);

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
                body.invoiceProjects.length &&
                body.timezoneOffset
            )
        ) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        if (body.invoiceNumber.length > 15)
            return res
                .status(HttpStatus.BAD_REQUEST)
                .json({ message: 'ERROR.CHECK_REQUEST_PARAMS(INVOICE_NUM_15_SYMBOL_LIMIT)' });

        let invoice = null;
        try {
            invoice = await this.invoiceService.getInvoice(param.id, userId);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }

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
            invoiceVendor: body.invoiceVendor,
            invoiceNumber: body.invoiceNumber,
            timezoneOffset: body.timezoneOffset,
            logo: file && file.path ? file.path : body.removeFile ? '' : null,
            discount: body.discount,
            reference: body.reference,
        };

        const invoiceData = {
            invoiceId: invoice.id,
            userId: invoice.user_id,
            vendorId: invoice.from.id,
            clientId: invoice.to.id,
            currency: invoice.currency,
            comment: invoice.comment,
            invoiceDate: invoice.invoice_date,
            dueDate: invoice.due_date,
            invoiceProjects: invoice.projects,
            invoiceVendor: invoice.invoice_vendor,
            invoiceNumber: invoice.invoice_number,
            timezoneOffset: invoice.timezone_offset,
            logo: invoice.logo,
            discount: invoice.discount,
            reference: invoice.reference,
        };

        Object.keys(invoiceData).forEach(prop => {
            const newValue = newInvoiceData[prop];
            invoiceData[prop] = typeof newValue === 'undefined' || newValue === null ? invoiceData[prop] : newValue;
        });

        try {
            const invoiceId = await this.invoiceService.updateInvoice(invoiceData);
            if (file && file.path && invoice.logo && fs.existsSync(invoice.logo)) {
                fs.unlinkSync(invoice.logo);
            }

            return res.status(HttpStatus.OK).json(invoiceId.data.update_invoice_vendor.returning[0]);
        } catch (err) {
            if (file && file.path) fs.unlinkSync(file.path);
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Patch(':id/payment-status')
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
        const userId: string = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const paymentStatus: boolean = body.paymentStatus || false;

            const invoiceId = await this.invoiceService.updatePaymentStatusInvoice(userId, param.id, paymentStatus);
            return res.status(HttpStatus.OK).json(invoiceId);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Post(':id/payment')
    @UseGuards(AuthGuard())
    async createInvoicePayment(
        @Headers() headers: any,
        @Response() res: any,
        @Param() param: { id: string },
        @Body()
        body: {
            sum: string;
            date: Date;
            comments?: string;
        }
    ) {
        const userId: string = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }
        if (!body.sum || !body.date) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            const invoicePayment = await this.invoiceService.addInvoicePayment(userId, param.id, body);
            return res.status(HttpStatus.OK).json(invoicePayment);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get(':id/payment-list')
    @UseGuards(AuthGuard())
    async getInvoicePaymentList(@Headers() headers: any, @Response() res: any, @Param() param: { id: string }) {
        const userId: string = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const invoicePaymentList = await this.invoiceService.getInvoicePaymentList(param.id, userId);
            return res.status(HttpStatus.OK).json(invoicePaymentList);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Delete(':id')
    @UseGuards(AuthGuard())
    async deleteInvoice(@Headers() headers: any, @Response() res: any, @Param() param: { id: string }) {
        const userId: string = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const delInvoice: any = await this.invoiceService.deleteInvoice(userId, param.id);
            if (delInvoice.logo && fs.existsSync(delInvoice.logo)) fs.unlinkSync(delInvoice.logo);

            const { invoice_vendor_id, logo, ...invoiceId } = delInvoice;
            return res.status(HttpStatus.OK).json(invoiceId);
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
        @Body() body: { message: string; sendingStatus: boolean }
    ) {
        if (!body.message || !body.sendingStatus) {
            throw new BadRequestException('ERROR.CHECK_REQUEST_PARAMS');
        }

        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        let invoice = null;
        try {
            invoice = await this.invoiceService.getInvoice(param.id, userId);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }

        const subject: string = 'Invoice #' + invoice.invoice_number + ' from - ' + invoice.from.email;
        const { message: html } = body;
        const to = invoice.to.email;
        if (!to) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: "The client's email is not filled" });
        }

        try {
            await this.mailService.send(to, subject, html);
            await this.invoiceService.updateSendingStatusInvoice(param.id, body.sendingStatus);
        } catch (e) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Mail did not send' });
        }

        return res.status(HttpStatus.OK).json({ message: 'Email sent!' });
    }

    @Get('free-invoice-number')
    @UseGuards(AuthGuard())
    async getFreeInvoiceNumber(@Headers() headers: any, @Response() res: any) {
        const userId: string = await this.authService.getVerifiedUserId(headers.authorization);

        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const invoiceNumber = await this.invoiceService.getFreeInvoiceNumber(userId);

            return res.status(HttpStatus.OK).json(invoiceNumber);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get(':id')
    async getInvoice(
        @Headers() headers: any,
        @Response() res: any,
        @Param() param: { id: string },
        @Query() params: { token: string }
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        const { ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;
        try {
            const invoice: Invoice = await this.invoiceService.getInvoice(param.id);
            const { team_id: invoiceTeamId } = invoice;

            const invoiceTeamOwner = ((await this.userService.getUserByRoleInTeam(
                invoiceTeamId,
                ROLE_OWNER
            )) as AxiosResponse).data.user_team;
            const { user_id: invoiceTeamOwnerId } = invoiceTeamOwner[0];

            const invoiceManagers = ((await this.userService.getUserByRoleInTeam(
                invoiceTeamId,
                ROLE_INVOICES_MANAGER
            )) as AxiosResponse).data.user_team;
            const invoiceManagersId = invoiceManagers.map(manager => manager.user_id);

            if ((userId && invoiceTeamOwnerId !== userId && !invoiceManagersId.includes(userId)) || !userId) {
                await this.invoiceService.updateInvoiceReviewedStatus(invoice.id, true);
            }

            return res.status(HttpStatus.OK).json(invoice);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }
}
