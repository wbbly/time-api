import { Controller, Get, Response, HttpStatus, Query, Post, Body, Patch, Param, Inject } from '@nestjs/common';
import { AxiosError } from 'axios';

import { TeamService } from '../team/team.service';
import { ConfigService } from '../core/config/config.service';

@Controller('team')
export class TeamController {
    constructor(private readonly teamService: TeamService, private readonly configService: ConfigService) {}

    @Get('current')
    async currentTeam(@Response() res: any, @Query() params) {
        if (!params.userId) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User ID needs to be specified.' });
        }

        try {
            const currentTeamRes = await this.teamService.getCurrentTeam(params.userId);
            return res.status(HttpStatus.OK).json(currentTeamRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get('list')
    async teamList(@Response() res: any) {
        try {
            const teamListRes = await this.teamService.getTeamList();
            return res.status(HttpStatus.OK).json(teamListRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get(':id/data')
    async getTeamDataById(@Response() res: any, @Param() param: any) {
        try {
            const dataRes = await this.teamService.getTeamData(param.id);
            return res.status(HttpStatus.OK).json(dataRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get(':id/rolecheck/:userId')
    async getTeamRole(@Response() res: any, @Param() param: any) {
        try {
            const teamRoleResult = await this.teamService.getTeamUserRole(param.id, param.userId);
            return res.status(HttpStatus.OK).json(teamRoleResult);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get(':id/invite/:invitationId')
    async acceptInvitation(@Response() res: any, @Param() param: any) {
        try {
            await this.teamService.acceptInvitation(param.id, param.invitationId);
        } catch (err) {
            const error: AxiosError = err;
            console.log(error.response ? error.response.data.errors : error);
        }

        return res.status(HttpStatus.OK).redirect(`${this.configService.get('APP_URL')}/team`);
    }

    @Post('add')
    async addTeam(@Response() res: any, @Body() body: { userId: string; teamName: string }) {
        if (!(body && body.userId && body.teamName)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User ID & Team Name required' });
        }

        try {
            const createdTeam = await this.teamService.createTeam(body.userId, body.teamName);
            return res.status(HttpStatus.CREATED).json(createdTeam);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Patch('switch')
    async switchTeam(@Response() res: any, @Body() body: { userId: string; teamId: string }) {
        if (!(body && body.userId && body.teamId)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User ID & Team ID required' });
        }
        try {
            const switchRes = await this.teamService.switchTeam(body.userId, body.teamId);
            return res.status(HttpStatus.OK).json(switchRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Patch('rename')
    async renameTeam(@Response() res: any, @Body() body: { userId: string; teamId: string; newName: string }) {
        if (!(body && body.userId && body.teamId && body.newName)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User ID, Team ID & New Team Name required' });
        }
        try {
            const renamedTeam = await this.teamService.renameTeam(body.userId, body.teamId, body.newName);
            return res.status(HttpStatus.OK).json(renamedTeam);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }
}
