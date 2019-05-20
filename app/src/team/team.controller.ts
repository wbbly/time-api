import { Controller, Get, Response, HttpStatus, Query, Post, Body, Patch, Param } from '@nestjs/common';

import { TeamService } from '../team/team.service';
import { AxiosError } from 'axios';
import { any } from 'bluebird';
import { TypeNameMetaFieldDef } from 'graphql';

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

    @Get(':id/data')
    async getTeamDataById(@Response() res: any, @Param() param: any) {
        try {
            const dataRes = await this.teamService.getTeamData(param.id);
            return res.status(HttpStatus.OK).json(dataRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Get(':id/rolecheck/:userId')
    async getTeamRole(@Response() res: any, @Param() param: any) {
        try {
            const teamRoleResult = await this.teamService.getTeamUserRole(param.id, param.userId);
            return res.status(HttpStatus.OK).json(teamRoleResult);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Post('add')
    async addTeam(@Response() res: any, @Body() body: { userId: string; teamName: string }) {
        if (!(body && body.userId && body.teamName)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User ID & Team Name required' });
        }

        try {
            const createdTeam = await this.teamService.addTeam(body.userId, body.teamName);
            return res.status(HttpStatus.CREATED).json(createdTeam);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Post('invite')
    async inviteMember(@Response() res: any, @Body() body: { userId: string; teamId: string; invitedUserId: string }) {
        if (!(body && body.userId && body.teamId && body.invitedUserId)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User ID, Team ID & Invited User ID required' });
        }

        try {
            const invited = await this.teamService.inviteMemberToTeam(body.userId, body.teamId, body.invitedUserId);
            return res.status(HttpStatus.CREATED).json(invited);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error);
        }
    }

    @Post('invite/email')
    async inviteByEmail(@Response() res: any, @Body() body: { email: string }) {
        if (!(body && body.email)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User Email is required' });
        }
        let usersData: any = await this.teamService.getAllUsers();
        let users = usersData.data.user;
        let userExists = users.filter(user => user.email === body.email);
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
