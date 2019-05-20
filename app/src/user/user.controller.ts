import { Controller, Get, Post, Patch, HttpStatus, Headers, Param, Response, Body } from '@nestjs/common';
import { AxiosError } from 'axios';

import { UserService } from '../user/user.service';
import { TeamService } from '../team/team.service';
import { MailService } from '../core/mail/mail.service';
import { ConfigService } from '../core/config/config.service';
import { User } from './interfaces/user.interface';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly teamService: TeamService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService
    ) {}

    @Get('list')
    async userList(@Response() res: any) {
        try {
            const userListRes = await this.userService.getUserList();
            return res.status(HttpStatus.OK).json(userListRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Get(':id/teams')
    async userTeams(@Response() res: any, @Param() param: any) {
        if (!param.id) return res.status(HttpStatus.BAD_REQUEST).json({ message: 'A Valid User ID is required' });

        try {
            const teamsData = await this.teamService.getAllUserTeams(param.id);
            return res.status(HttpStatus.OK).json(teamsData);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }

    @Post('login')
    async loginUser(@Response() res: any, @Body() body: User) {
        if (!(body && body.email && body.password)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email and password are required!' });
        }

        let user = null;
        try {
            user = await this.userService.getUserByEmail(body.email);
        } catch (error) {
            console.log(error);
        }

        if (user) {
            if (await this.userService.compareHash(body.password, user.password)) {
                return res.status(HttpStatus.OK).json({ user });
            }
        }

        return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email or password wrong!' });
    }

    @Post('invite')
    async inviteByEmail(
        @Response() res: any,
        @Body() body: { userId: string; teamId: string; teamName: string; email: string }
    ) {
        if (!(body && body.email)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'User Email is required' });
        }

        let usersData: any = await this.userService.getUserList();
        let users = usersData.data.user;
        let userExists = users.filter(user => user.email === body.email);
        if (userExists.length > 0) {
            //Such user is already registered
            const invitedData: any = await this.teamService.inviteMemberToTeam(
                body.userId,
                body.teamId,
                userExists[0].id
            );
            //Send an email:
            const to = body.email;
            //@TODO Add Team Name in the subject
            const subject = `You've been invited to the new team | ${body.teamName}!`;
            const html = `
            Please follow the link below to accept the invitation to the ${body.teamName} team:     
            <br /><br />
            ${this.configService.get('API_URL')}/team/${body.teamId}/invite/${
                invitedData.data.insert_user_team.returning[0].invite_hash
            }
            <br /><br />
            Have a nice one!
        `;
            this.mailService.send(to, subject, html);
        } else {
            //No such user registered, let us create one.

            //Generating random password
            const userPassword = Math.random()
                .toString(36)
                .slice(-8);
            const createdData: any = await this.userService.createUser({
                username: body.email,
                email: body.email,
                password: userPassword,
            });
            //Send an email with successful registration

            const to1 = body.email;
            //@TODO Add Team Name in the subject
            const subject1 = `You've been successfully registered in the Wobbly`;
            const html1 = `
            Please use the credentials below to access the Wobbly ${this.configService.get('APP_URL')}
            <br /> <br />

            Email: ${body.email}
            <br /> <br />

            Password: ${userPassword}

            <br /> <br />
            Have a nice one!
        `;
            this.mailService.send(to1, subject1, html1);

            //Get created user ID from createdData and process inviteRequest from Team Service

            const invitedData: any = await this.teamService.inviteMemberToTeam(
                body.userId,
                body.teamId,
                createdData.data.insert_user.returning[0].id
            );
            //Send an email:
            const to2 = body.email;
            //@TODO Add Team Name in the subject
            const subject2 = `You've been invited to the new team | ${body.teamName}!`;
            const html2 = `
            Please follow the link below to accept the invitation to the ${body.teamName} team:     
            <br /><br />
            ${this.configService.get('API_URL')}team/${body.teamId}/invite/${
                invitedData.data.insert_user_team.returning[0].invite_hash
            }
            <br /><br />
            Have a nice one!
        `;
            this.mailService.send(to2, subject2, html2);
        }

        return res.status(HttpStatus.CREATED).json({
            success: true,
        });
    }

    @Post('register')
    async registerUser(@Response() res: any, @Body() body: any) {
        if (!(body && body.email && body.password)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email and password are required!' });
        }

        let userExists = false;
        try {
            userExists = await this.userService.checkUserExists({ email: body.email });
        } catch (error) {
            console.log(error);
        }

        if (userExists === true) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email exists' });
        }

        let user = null;
        try {
            user = await this.userService.createUser({
                username: body.username || body.email,
                email: body.email,
                password: body.password,
            });
        } catch (error) {
            console.log(error);
        }

        if (user) {
            return res.status(HttpStatus.OK).json(user);
        }

        return res
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: 'An error occurred while creating the user!' });
    }

    @Patch(':id')
    async updateUser(@Headers() header: any, @Param() param: any, @Response() res: any, @Body() body: any) {
        if (!(header && header['x-admin-id'])) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'x-admin-id header is required!' });
        }

        let userIsAdmin = false;
        try {
            userIsAdmin = await this.userService.checkUserIsAdmin(header['x-admin-id']);
        } catch (error) {
            console.log(error);
        }

        if (!userIsAdmin) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: "You don't have a permissions to update the user!" });
        }

        let user = null;
        console.log(param.id);
        try {
            user = await this.userService.getUserById(param.id, false);
        } catch (error) {
            console.log(error);
        }

        if (!user) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'An error occurred while updating the user!' });
        }

        const { username, email, isActive, teamId, roleName } = user;
        const userData: any = { username, email, isActive, teamId, roleName };
        Object.keys(userData).forEach(prop => {
            const value = body && body[prop];
            userData[prop] = typeof value === 'undefined' || value === null ? userData[prop] : value;
        });

        try {
            const updateUserRes = await this.userService.updateUser(param.id, userData);

            return res.status(HttpStatus.OK).json(updateUserRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }
}
