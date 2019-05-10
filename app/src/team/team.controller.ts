import { Controller, Get, Response, HttpStatus, Query, Post, Body, Patch } from '@nestjs/common';

import { TeamService } from '../team/team.service';
import { AxiosError } from 'axios';

@Controller('team')
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

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
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
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
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Get('list')
    async teamList(@Response() res: any) {
        try {
            const teamListRes = await this.teamService.getTeamList();
            return res.status(HttpStatus.OK).json(teamListRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Patch('rename')
    async renameTeam(@Response() res: any, @Body() body: { teamId: string; newName: string }) {
        if (!(body && body.teamId && body.newName)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Team ID & New Team Name required' });
        }
        try {
            const renamedTeam = await this.teamService.renameTeam(body.teamId, body.newName);
            return res.status(HttpStatus.OK).json(renamedTeam);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }
}
