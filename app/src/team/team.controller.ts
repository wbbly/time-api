import { Controller, Get, Response, HttpStatus, Query, Post, Body } from '@nestjs/common';

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

    @Post('switch')
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
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }
}
