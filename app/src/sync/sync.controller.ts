import {
    Controller,
    Get,
    Post,
    Param,
    Response,
    HttpStatus,
    Headers,
    UseGuards,
    UnauthorizedException,
    Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AxiosError, AxiosResponse } from 'axios';

import { SyncService } from './sync.service';
import { AuthService } from '../auth/auth.service';

@Controller('sync')
export class SyncController {
    constructor(private readonly syncService: SyncService, private readonly authService: AuthService) {}

    @Get('jira/my-permissions')
    @UseGuards(AuthGuard())
    async getJiraPermissions(@Headers() headers: any, @Response() res: any, @Query() params) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(params.token && params.urlJira)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            const checkJiraSyncRes = await this.syncService.checkJiraSync(params.urlJira, params.token);
            return res.status(HttpStatus.OK).json(checkJiraSyncRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Post('jira/issue/:id/worklog')
    @UseGuards(AuthGuard())
    async addJiraWorklog(@Headers() headers: any, @Param() param: any, @Response() res: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const addJiraWorklogRes = await this.syncService.addJiraWorklog(userId, param.id);
            return res.status(HttpStatus.OK).json(addJiraWorklogRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }
}
