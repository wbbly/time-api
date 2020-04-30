import {
    Controller,
    Get,
    Response,
    HttpStatus,
    Query,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    Headers,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AxiosError, AxiosResponse } from 'axios';

import { TeamService } from '../team/team.service';
import { AuthService } from '../auth/auth.service';

@Controller('team')
export class TeamController {
    constructor(private readonly teamService: TeamService, private readonly authService: AuthService) {}

    @Get('current')
    @UseGuards(AuthGuard())
    async currentTeam(@Headers() headers: any, @Response() res: any, @Query() params) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const currentTeamRes = await this.teamService.getCurrentTeam(userId);
            return res.status(HttpStatus.OK).json(currentTeamRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get('current/detailed-data')
    @UseGuards(AuthGuard())
    async getTeamDataById(@Headers() headers: any, @Response() res: any, @Param() param: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        let teamId;
        try {
            const currentTeamRes = await this.teamService.getCurrentTeam(userId);
            teamId = (currentTeamRes as AxiosResponse).data.user_team[0].team.id;
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }

        if (!teamId) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.NOT_MEMBER' });
        }

        try {
            const dataRes = await this.teamService.getTeamData(teamId);
            return res.status(HttpStatus.OK).json(dataRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get('list')
    @UseGuards(AuthGuard())
    async teamList(@Headers() headers: any, @Response() res: any) {
        try {
            const teamListRes = await this.teamService.getTeamList();
            return res.status(HttpStatus.OK).json(teamListRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get(':id/invite/:invitationId')
    async acceptInvitation(@Headers() headers: any, @Response() res: any, @Param() param: any) {
        try {
            await this.teamService.acceptInvitation(param.id, param.invitationId);
        } catch (err) {
            const error: AxiosError = err;
            console.log(error.response ? error.response.data.errors : error);
        }

        return res.status(HttpStatus.OK).redirect(`${process.env.APP_URL}/team`);
    }

    @Post('add')
    @UseGuards(AuthGuard())
    async addTeam(@Headers() headers: any, @Response() res: any, @Body() body: { teamName: string }) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!body.teamName) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            const createdTeam = await this.teamService.createTeam(userId, body.teamName);
            return res.status(HttpStatus.CREATED).json(createdTeam);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Patch('switch')
    @UseGuards(AuthGuard())
    async switchTeam(@Headers() headers: any, @Response() res: any, @Body() body: { teamId: string }) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!body.teamId) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            const switchRes = await this.teamService.switchTeam(userId, body.teamId);
            return res.status(HttpStatus.OK).json(switchRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Patch('rename')
    @UseGuards(AuthGuard())
    async renameTeam(@Headers() headers: any, @Response() res: any, @Body() body: { teamId: string; newName: string }) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(body.teamId && body.newName)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            const renamedTeam = await this.teamService.renameTeam(userId, body.teamId, body.newName);
            return res.status(HttpStatus.OK).json(renamedTeam);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }
}
