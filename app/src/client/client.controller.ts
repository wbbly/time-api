import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Response,
    HttpStatus,
    Body,
    Headers,
    UseGuards,
    UnauthorizedException,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AxiosError } from 'axios';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

import { ClientService } from './client.service';
import { AuthService } from '../auth/auth.service';

@Controller('client')
export class ClientController {
    constructor(private readonly clientService: ClientService, private readonly authService: AuthService) {}

    @Get('list')
    @UseGuards(AuthGuard())
    async clientList(@Headers() headers: any, @Response() res: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const clientList = await this.clientService.getClientList(userId);

            return res.status(HttpStatus.OK).json(clientList);
        } catch (e) {
            const error: AxiosError = e;

            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Post('add')
    @UseGuards(AuthGuard())
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './avatars',
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
    async addClient(
        @Headers() headers: any,
        @Response() res: any,
        @Body()
        body: {
            name: string;
            language: string;
            country: string;
            city: string;
            state: string;
            phone: string;
            email: string;
            zip: string;
            companyName: string;
        },
        @UploadedFile() file
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!body.companyName) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            const clientRequest = {
                userId,
                name: body.name,
                language: body.language,
                country: body.country,
                city: body.city,
                state: body.state,
                phone: body.phone,
                email: body.email,
                zip: body.zip,
                avatar: (file && file.path) || null,
                companyName: body.companyName.trim(),
            };
            await this.clientService.addClient(clientRequest);
            const clientList = await this.clientService.getClientList(userId);

            return res.status(HttpStatus.OK).json(clientList);
        } catch (e) {
            if (file && file.path) {
                fs.unlinkSync(file.path);
            }

            const error: AxiosError = e;

            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Delete(':id')
    @UseGuards(AuthGuard())
    async deleteClient(@Headers() headers: any, @Response() res: any, @Param() param: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        const clientId = param.id;
        if (!clientId) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            await this.clientService.deleteClient(userId, clientId);
            const clientList = await this.clientService.getClientList(userId);

            return res.status(HttpStatus.OK).json(clientList);
        } catch (e) {
            const error: AxiosError = e;

            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './avatars',
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
    @Patch(':id')
    @UseGuards(AuthGuard())
    async patchClient(
        @Headers() headers: any,
        @Response() res: any,
        @Param() param: any,
        @Body()
        body: {
            name: string;
            language: string;
            country: string;
            city: string;
            state: string;
            phone: string;
            email: string;
            zip: string;
            companyName: string;
        },
        @UploadedFile() file
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        const clientId = param.id;
        const companyName = body.companyName;
        if (!(clientId && companyName)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            const client: any = await this.clientService.getClientById(param.id);
            const clientRequest = {
                userId,
                clientId,
                name: body.name,
                language: body.language,
                country: body.country,
                city: body.city,
                state: body.state,
                phone: body.phone,
                email: body.email,
                zip: body.zip,
                avatar: (file && file.path) || client.avatar,
                companyName: body.companyName.trim(),
            };

            await this.clientService.patchClient(clientRequest);
            if (file && file.path && client.avatar) {
                fs.unlinkSync(client.avatar);
            }

            const clientList = await this.clientService.getClientList(userId);

            return res.status(HttpStatus.OK).json(clientList);
        } catch (e) {
            if (file && file.path) {
                fs.unlinkSync(file.path);
            }

            const error: AxiosError = e;

            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }
}
