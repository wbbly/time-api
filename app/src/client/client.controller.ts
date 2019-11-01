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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AxiosError } from 'axios';

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
    async addClient(@Headers() headers: any, @Response() res: any, @Body() body: { name: string }) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!body.name) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        let { name } = body;
        const clientName = name.trim();
        try {
            await this.clientService.addClient(userId, clientName);
            const clientList = await this.clientService.getClientList(userId);
            return res.status(HttpStatus.OK).json(clientList);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    // @Delete(':id')
    // @UseGuards(AuthGuard())
    // async deleteClient(@Headers() headers: any, @Response() res: any, @Param() param: any) {
    //     const userId = await this.authService.getVerifiedUserId(headers.authorization);
    //     if (!userId) {
    //         throw new UnauthorizedException();
    //     }

    //     const clientId = param.id;
    //     if (!clientId) {
    //         return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
    //     }

    //     try {
    //         await this.clientService.deleteClient(userId, clientId);
    //         const clientList = await this.clientService.getClientList(userId);
    //         return res.status(HttpStatus.OK).json(clientList);
    //     } catch (e) {
    //         const error: AxiosError = e;
    //         return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
    //     }
    // }

    @Patch(':id')
    @UseGuards(AuthGuard())
    async patchClient(
        @Headers() headers: any,
        @Response() res: any,
        @Param() param: any,
        @Body() body: { name: string }
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        const clientId = param.id;
        const clientName = body.name;
        if (!(clientId && clientName)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            await this.clientService.patchClient(userId, clientId, clientName);
            const clientList = await this.clientService.getClientList(userId);
            return res.status(HttpStatus.OK).json(clientList);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }
}
