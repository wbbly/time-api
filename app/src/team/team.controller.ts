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
import { AxiosError } from 'axios';

import { TeamService } from '../team/team.service';
import { ConfigService } from '../core/config/config.service';
import { AuthService } from '../auth/auth.service';

@Controller('team')
export class TeamController {
    constructor(
        private readonly teamService: TeamService,
        private readonly configService: ConfigService,
        private readonly authService: AuthService
    ) {}

    @Get('current')
    @UseGuards(AuthGuard())
    async currentTeam(@Headers() headers: any, @Response() res: any, @Query() params) {
        const userId = await this.authService.getUserId(headers.authorization);
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

    @Get(':id/data')
    @UseGuards(AuthGuard())
    async getTeamDataById(@Headers() headers: any, @Response() res: any, @Param() param: any) {
        try {
            const dataRes = await this.teamService.getTeamData(param.id);
            return res.status(HttpStatus.OK).json(dataRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get(':id/rolecheck/:userId')
    @UseGuards(AuthGuard())
    async getTeamRole(@Headers() headers: any, @Response() res: any, @Param() param: any) {
        try {
            const teamRoleResult = await this.teamService.getTeamUserRole(param.id, param.userId);
            return res.status(HttpStatus.OK).json(teamRoleResult);
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

        return res.status(HttpStatus.OK).redirect(`${this.configService.get('APP_URL')}/team`);
    }

    @Post('add')
    @UseGuards(AuthGuard())
    async addTeam(@Headers() headers: any, @Response() res: any, @Body() body: { teamName: string }) {
        const userId = await this.authService.getUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!body.teamName) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Team Name required' });
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
        const userId = await this.authService.getUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!body.teamId) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Team ID required' });
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
        if (!(body.teamId && body.newName)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User ID, Team ID & New Team Name required' });
        }

        try {
            const renamedTeam = await this.teamService.renameTeam(body.teamId, body.newName);
            return res.status(HttpStatus.OK).json(renamedTeam);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }
}
