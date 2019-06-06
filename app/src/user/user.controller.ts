import { Controller, Get, Post, Patch, HttpStatus, Headers, Param, Response, Body } from '@nestjs/common';
import { AxiosError } from 'axios';

import { UserService } from '../user/user.service';
import { TeamService } from '../team/team.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { MailService } from '../core/mail/mail.service';
import { ConfigService } from '../core/config/config.service';
import { User } from './interfaces/user.interface';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService
    ) {}

    @Get('list')
    async userList(@Response() res: any) {
        try {
            const userListRes = await this.userService.getUserList();
            return res.status(HttpStatus.OK).json(userListRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
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
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Post('reset-password')
    async resetPassword(@Response() res: any, @Body() body: { email: string }) {
        if (!(body && body.email)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email are required!' });
        }

        let user = null;
        try {
            user = await this.userService.getUserByEmail(body.email);
        } catch (error) {
            console.log(error);
        }

        if (user) {
            let resetPasswordData = null;
            try {
                resetPasswordData = await this.userService.resetPassword(body.email);
            } catch (error) {
                console.log(error);
            }

            if (resetPasswordData) {
                // Send an email:
                const to = body.email;
                const subject = `You've been requested the reset password!`;
                const html = `
                Follow the link below to reset the password:
                <br /><br />
                ${this.configService.get('APP_URL')}/reset-password?token=${
                    resetPasswordData.data.update_user.returning[0].reset_password_hash
                }
                <br /><br />
                <a href="${this.configService.get('APP_URL')}">Wobbly</a>
                <br />
                © 2019 All rights reserved.
            `;
                this.mailService.send(to, subject, html);
                return res.status(HttpStatus.OK).json({ message: 'Check the mailbox for a password reset email!' });
            }
        }

        return res
            .status(HttpStatus.FORBIDDEN)
            .json({ message: 'An error occurred while sending a password reset email!' });
    }

    @Post('set-password')
    async setPassword(@Response() res: any, @Body() body: { token: string; password: string }) {
        if (!(body && body.token && body.password)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Token and password are required!' });
        }

        let user = null;
        try {
            user = await this.userService.getUserByResetPasswordHash(body.token);
        } catch (error) {
            console.log(error);
        }

        if (user) {
            let setPasswordData = null;
            try {
                setPasswordData = await this.userService.setPassword(body.token, body.password);
            } catch (error) {
                console.log(error);
            }

            if (setPasswordData) {
                // Send an email:
                const to = setPasswordData.data.update_user.returning[0].email;
                const subject = `You've been successfully reset the password!`;
                const html = `
                Please use the credentials below to access the Wobbly ${this.configService.get('APP_URL')}
                <br /><br />

                <b>Email:</b> ${to}<br />
                <b>Password:</b> ${body.password}

                <br /><br />
                <a href="${this.configService.get('APP_URL')}">Wobbly</a>
                <br />
                © 2019 All rights reserved.
            `;
                this.mailService.send(to, subject, html);
                return res.status(HttpStatus.OK).json({ message: "You've been successfully reset the password!" });
            }
        }

        return res
            .status(HttpStatus.FORBIDDEN)
            .json({ message: 'Sorry, something went wrong. Please try again later!' });
    }

    @Post('change-password')
    async changePassword(
        @Headers() header: any,
        @Response() res: any,
        @Body() body: { password: string; newPassword: string }
    ) {
        if (!(header && header['x-user-id'])) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'x-user-id header is required!' });
        }

        if (!(body && body.password && body.newPassword)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Current and new passwords are required!' });
        }

        let user = null;
        try {
            user = await this.userService.getUserById(header['x-user-id'], true);
        } catch (error) {
            console.log(error);
        }

        if (user) {
            if (await this.userService.compareHash(body.password, user.password)) {
                let changePasswordData = null;
                try {
                    changePasswordData = await this.userService.changePassword(header['x-user-id'], body.newPassword);
                } catch (error) {
                    console.log(error);
                }

                if (changePasswordData) {
                    // Send an email:
                    const to = changePasswordData.data.update_user.returning[0].email;
                    const subject = `You've been successfully changed the password!`;
                    const html = `
                    Please use the credentials below to access the Wobbly ${this.configService.get('APP_URL')}
                    <br /><br />

                    <b>Email:</b> ${to}<br />
                    <b>Password:</b> ${body.password}

                    <br /><br />
                    <a href="${this.configService.get('APP_URL')}">Wobbly</a>
                    <br />
                    © 2019 All rights reserved.
                `;
                    this.mailService.send(to, subject, html);
                    return res
                        .status(HttpStatus.OK)
                        .json({ message: "You've been successfully changed the password!" });
                }
            } else {
                return res.status(HttpStatus.FORBIDDEN).json({ message: 'Current password is wrong!' });
            }
        }

        return res.status(HttpStatus.FORBIDDEN).json({ message: 'An error occurred while changing a password!' });
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
                delete user.password;
                user['appVersion'] = 'v0.0.1'; // @TODO: replace with real application version

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
        if (!(body && body.userId && body.teamId && body.teamName && body.email)) {
            return res
                .status(HttpStatus.BAD_REQUEST)
                .json({ message: 'Params userId, teamId, teamName and email are required' });
        }

        const usersData: any = await this.userService.getUserList();
        const users = usersData.data.user;
        const userExists = users.filter(user => user.email === body.email);

        let invitedData: any = null;
        if (userExists.length > 0) {
            // Such user is already registered
            try {
                invitedData = await this.teamService.inviteMemberToTeam(body.userId, body.teamId, userExists[0].id);
            } catch (e) {
                const error: AxiosError = e;
                return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
            }

            // Send an email:
            const to = body.email;
            const subject = `You've been invited to the "${body.teamName}" team!`;
            const html = `
            Follow the link below to accept the invitation to the "${body.teamName}" team:
            <br /><br />
            ${this.configService.get('APP_URL')}/team/${body.teamId}/invite/${
                invitedData.data.insert_user_team.returning[0].invite_hash
            }
            <br /><br />
            <a href="${this.configService.get('APP_URL')}">Wobbly</a>
            <br />
            © 2019 All rights reserved.
        `;
            this.mailService.send(to, subject, html);
        } else {
            // No such user registered, let us create one.

            // Generating random password
            const userPassword = Math.random()
                .toString(36)
                .slice(-8);
            const createdData: any = await this.userService.createUser({
                username: body.email,
                email: body.email,
                password: userPassword,
            });

            // Get created user ID from createdData and process inviteRequest from Team Service
            invitedData = await this.teamService.inviteMemberToTeam(
                body.userId,
                body.teamId,
                createdData.data.insert_user.returning[0].id
            );

            // Send an email:
            const subject = `You've been invited to the "${body.teamName}" team!`;
            const html = `
            Follow the link below to accept the invitation to the "${body.teamName}" team:
            <br /><br />
            ${this.configService.get('APP_URL')}/team/${body.teamId}/invite/${
                invitedData.data.insert_user_team.returning[0].invite_hash
            }
            <br /><br />
            <br /><br />
            Please use the credentials below to access the Wobbly ${this.configService.get('APP_URL')}
            <br /><br />

            <b>Email:</b> ${body.email}<br />
            <b>Password:</b> ${userPassword}

            <br /><br />
            <a href="${this.configService.get('APP_URL')}">Wobbly</a>
            <br />
            © 2019 All rights reserved.
        `;
            this.mailService.send(body.email, subject, html);
        }

        return res.status(HttpStatus.CREATED).json({
            invitedUserId: invitedData.data.insert_user_team.returning,
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
        if (!(header && header['x-user-id'] && header['x-team-id'])) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'x-user-id and x-team-id headers are required!' });
        }

        body = body || {};

        const userId = header['x-user-id'];
        const teamId = header['x-team-id'];

        let userIsAdmin = false;
        let userIsActive = false;
        try {
            const userDataByTeamData = await this.userService.getUserDataByTeam(userId, teamId);
            userIsAdmin =
                userDataByTeamData.data.user[0].user_teams[0].role_collaboration.title ===
                this.roleCollaborationService.ROLES.ROLE_ADMIN;
            userIsActive = userDataByTeamData.data.user[0].user_teams[0].is_active;
        } catch (error) {
            console.log(error);
        }

        if (!userIsAdmin) {
            if (param.id !== userId) {
                return res
                    .status(HttpStatus.FORBIDDEN)
                    .json({ message: "You don't have a permissions to update the user!" });
            }
        }

        let user = null;
        try {
            user = await this.userService.getUserById(param.id, false);
        } catch (error) {
            console.log(error);
        }

        if (!user) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'An error occurred while updating the user!' });
        }

        let allowedDataToUpdate: any = {
            username: body.username,
            email: body.email,
            isActive: body.isActive,
            roleName: body.roleName,
        };
        if (!userIsAdmin) {
            allowedDataToUpdate = { username: body.username, email: body.email };
        }

        const { username, email } = user;
        const userData = {
            username,
            email,
            isActive: userIsActive,
            roleName: userIsAdmin
                ? this.roleCollaborationService.ROLES.ROLE_ADMIN
                : this.roleCollaborationService.ROLES.ROLE_MEMBER,
        };
        Object.keys(userData).forEach(prop => {
            const value = allowedDataToUpdate[prop];
            userData[prop] = typeof value === 'undefined' || value === null ? userData[prop] : value;
        });

        try {
            const updateUserRes = await this.userService.updateUser(userId, teamId, param.id, userData);

            return res.status(HttpStatus.OK).json(updateUserRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }
}
