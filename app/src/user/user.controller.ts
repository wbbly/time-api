import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    HttpStatus,
    Headers,
    Param,
    Response,
    Body,
    UseGuards,
    UnauthorizedException,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { AxiosError, AxiosResponse } from 'axios';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { TeamService } from '../team/team.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { MailService } from '../core/mail/mail.service';
import { ConfigService } from '../core/config/config.service';
import { User } from './interfaces/user.interface';

@Controller('user')
export class UserController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService
    ) {}

    @Get('')
    @UseGuards(AuthGuard())
    async getUser(@Headers() headers: any, @Response() res: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        let user = null;
        try {
            user = await this.userService.getUserById(userId);
        } catch (err) {
            console.log(err);
        }

        if (!user) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.GET_USER_FAILED' });
        }

        return res.status(HttpStatus.OK).json(this.userService.getPublicUserData(user));
    }

    @Get('list')
    @UseGuards(AuthGuard())
    async userList(@Headers() headers: any, @Response() res: any) {
        try {
            const userListRes = await this.userService.getUserList();
            return res.status(HttpStatus.OK).json(userListRes);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Get('teams')
    @UseGuards(AuthGuard())
    async userTeams(@Headers() headers: any, @Response() res: any, @Param() param: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const teamsData = await this.teamService.getAllUserTeams(userId);
            return res.status(HttpStatus.OK).json(teamsData);
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Post('reset-password')
    async resetPassword(@Response() res: any, @Body() body: { email: string }) {
        if (!body.email) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
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
                return res.status(HttpStatus.OK).json({ message: 'SUCCESS.USER.RESET_EMAIL_CHECK' });
            }
        }

        return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.RESET_EMAIL_FAILED' });
    }

    @Post('set-password')
    async setPassword(@Response() res: any, @Body() body: { token: string; password: string }) {
        if (!(body.token && body.password)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
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
                return res.status(HttpStatus.OK).json({ message: 'SUCCESS.USER.RESET_PASSWORD' });
            }
        }

        return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.INTERNAL' });
    }

    @Post('change-password')
    @UseGuards(AuthGuard())
    async changePassword(
        @Headers() headers: any,
        @Response() res: any,
        @Body() body: { password: string; newPassword: string }
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(body.password && body.newPassword)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        let user = null;
        try {
            user = await this.userService.getUserById(userId);
        } catch (error) {
            console.log(error);
        }

        if (user) {
            if (await this.userService.compareHash(body.password, user.password)) {
                let changePasswordData = null;
                try {
                    changePasswordData = await this.userService.changePassword(userId, body.newPassword);
                } catch (error) {
                    console.log(error);
                }

                if (changePasswordData) {
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
                    return res.status(HttpStatus.OK).json({ message: 'SUCCESS.USER.PASSWORD_CHANGED' });
                }
            } else {
                return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.CURRENT_PASSWORD_WRONG' });
            }
        }

        return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.CHANGE_PASSWORD_FAILED' });
    }

    @Post('login')
    async loginUser(@Response() res: any, @Body() body: User) {
        if (!(body.email && body.password)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        let user = null;
        try {
            user = await this.userService.getUserByEmail(body.email);
        } catch (error) {
            console.log(error);
        }

        if (user) {
            if (await this.userService.compareHash(body.password, user.password)) {
                const token = await this.userService.signIn(user);

                return res.status(HttpStatus.OK).json({ token });
            }
        }

        return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.EMAIL_PASSWORD_WRONG' });
    }

    @Post('login-fb')
    async loginFacebookUser(@Response() res: any, @Body() body: User) {
        if (!(body.id && body.username)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        const userId = body.id;
        const userEmail = body.email || `fb${userId}@wobbly.me`;
        const userName = body.username || userEmail;

        let userFb = null;
        try {
            userFb = await this.userService.getFacebookUserByEmail(userEmail);
        } catch (error) {
            console.log(error);
        }

        if (userFb) {
            const token = await this.userService.signIn(userFb);

            return res.status(HttpStatus.OK).json({ token });
        } else {
            let user = null;
            try {
                user = await this.userService.getUserByEmail(userEmail);
            } catch (error) {
                console.log(error);
            }

            let addSocialEntryData = null;
            try {
                addSocialEntryData = await this.userService.addSocialEntry(userId);
            } catch (error) {
                console.log(error);
            }

            let socialId = null;
            if (addSocialEntryData) {
                socialId = addSocialEntryData.data.update_user.returning[0].id;
                await this.userService.updateUserSocial(userEmail, socialId);
            }

            if (user) {
                const token = await this.userService.signIn(user);

                return res.status(HttpStatus.OK).json({ token });
            }

            let newUserFb = null;
            try {
                const userPassword = Math.random()
                    .toString(36)
                    .slice(-8);
                await this.userService.createUser({
                    username: userName,
                    email: userEmail,
                    password: userPassword,
                    socialId,
                    language: body.language,
                });
                newUserFb = await this.userService.getFacebookUserByEmail(userEmail);
            } catch (error) {
                console.log(error);
            }

            if (newUserFb) {
                const token = await this.userService.signIn(newUserFb);

                return res.status(HttpStatus.OK).json({ token });
            }

            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'ERROR.USER.USER_FAILED' });
        }
    }

    @Post('invite')
    @UseGuards(AuthGuard())
    async inviteByEmail(
        @Headers() headers: any,
        @Response() res: any,
        @Body() body: { teamId: string; teamName: string; email: string }
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!body.email) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        let teamId;
        let teamName;
        try {
            const currentTeamRes = await this.teamService.getCurrentTeam(userId);
            const userTeamData = (currentTeamRes as AxiosResponse).data.user_team[0];
            if (!userTeamData) {
                return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.CREATE_INVITE_FAILED' });
            }
            teamId = userTeamData.team.id;
            teamName = userTeamData.team.name || '';
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }

        if (!teamId) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.NOT_MEMBER' });
        }

        const usersData: any = await this.userService.getUserList();
        const users = usersData.data.user;
        const userExists = users.filter(user => user.email === body.email);

        let invitedData: any = null;
        if (userExists.length > 0) {
            // Such user is already registered
            try {
                invitedData = await this.teamService.inviteMemberToTeam(userId, teamId, userExists[0].id);
            } catch (e) {
                const error: AxiosError = e;
                return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
            }

            const to = body.email;
            const subject = `You've been invited to the "${teamName}" team!`;
            const html = `
            Follow the link below to accept the invitation to the "${teamName}" team:
            <br /><br />
            ${this.configService.get('APP_URL')}/team/${teamId}/invite/${
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
                socialId: null,
            });

            // Get created user ID from createdData and process inviteRequest from Team Service
            invitedData = await this.teamService.inviteMemberToTeam(
                userId,
                teamId,
                createdData.data.insert_user.returning[0].id
            );

            const subject = `You've been invited to the "${teamName}" team!`;
            const html = `
            Follow the link below to accept the invitation to the "${teamName}" team:
            <br /><br />
            ${this.configService.get('APP_URL')}/team/${teamId}/invite/${
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
        if (!(body.email && body.password)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        let userExists = false;
        try {
            userExists = await this.userService.checkUserExists({ email: body.email });
        } catch (error) {
            console.log(error);
        }

        if (userExists === true) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.EMAIL_EXISTS' });
        }

        let user = null;
        try {
            user = await this.userService.createUser({
                username: body.username || body.email,
                email: body.email,
                password: body.password,
                socialId: null,
                language: body.language,
            });
        } catch (error) {
            console.log(error);
        }

        if (user) {
            return res.status(HttpStatus.OK).json(user);
        }

        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'ERROR.USER.CREATE_USER_FAILED' });
    }

    @Patch(':id')
    @UseGuards(AuthGuard())
    async updateUser(@Headers() headers: any, @Param() param: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId || param.id !== userId) {
            throw new UnauthorizedException();
        }

        let user = null;
        try {
            user = await this.userService.getUserById(param.id);
        } catch (err) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }

        if (!user) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }

        const newUserData: any = {
            username: body.username,
            email: body.email,
            language: body.language,
            tokenJira: body.tokenJira,
            urlJira: body.urlJira,
            typeJira: body.typeJira,
            loginJira: body.loginJira,
            phone: body.phone,
            onboardingMobile: body.onboardingMobile,
        };

        const userData = {
            username: user.username,
            email: user.email,
            language: user.language,
            tokenJira: user.tokenJira,
            urlJira: user.urlJira,
            typeJira: user.typeJira,
            loginJira: user.loginJira,
            phone: user.phone,
            onboardingMobile: user.onboardingMobile,
        };
        Object.keys(userData).forEach(prop => {
            const newValue = newUserData[prop];
            userData[prop] = typeof newValue === 'undefined' || newValue === null ? userData[prop] : newValue;
        });

        try {
            await this.userService.updateUser(userId, userData);

            let userUpdated = null;
            try {
                userUpdated = await this.userService.getUserById(userId);
            } catch (err) {
                console.log(err);
            }

            if (!userUpdated) {
                return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
            }

            return res.status(HttpStatus.OK).json(this.userService.getPublicUserData(userUpdated));
        } catch (err) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }
    }

    @Post(':id/avatar')
    @UseGuards(AuthGuard())
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './avatars',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');

                    return cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
        })
    )
    async addUserAvatar(
        @Headers() headers: any,
        @Param() param: any,
        @Response() res: any,
        @Body() body: any,
        @UploadedFile() file
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId || param.id !== userId) {
            throw new UnauthorizedException();
        }

        if (!(file && file.path)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        let user = null;
        let avatarPath = null;
        try {
            user = await this.userService.getUserById(param.id);
            avatarPath = user.avatar;
        } catch (err) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }

        if (!user) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }

        try {
            await this.userService.updateUserAvatar(userId, file.path);

            let userUpdated = null;
            try {
                userUpdated = await this.userService.getUserById(userId);
            } catch (err) {
                console.log(err);
            }

            if (!userUpdated) {
                return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
            }

            if (avatarPath) {
                fs.unlinkSync(avatarPath);
            }

            return res.status(HttpStatus.OK).json(this.userService.getPublicUserData(userUpdated));
        } catch (err) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }
    }

    @Delete(':id/avatar')
    @UseGuards(AuthGuard())
    async removeUserAvatar(@Headers() headers: any, @Param() param: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId || param.id !== userId) {
            throw new UnauthorizedException();
        }

        let user = null;
        let avatarPath = null;
        try {
            user = await this.userService.getUserById(param.id);
            avatarPath = user.avatar;
        } catch (err) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }

        if (!user) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }

        try {
            await this.userService.updateUserAvatar(userId, null);

            let userUpdated = null;
            try {
                userUpdated = await this.userService.getUserById(userId);
            } catch (err) {
                console.log(err);
            }

            if (!userUpdated) {
                return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
            }

            if (avatarPath) {
                fs.unlinkSync(avatarPath);
            }

            return res.status(HttpStatus.OK).json(this.userService.getPublicUserData(userUpdated));
        } catch (err) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }
    }

    @Patch(':id/team')
    @UseGuards(AuthGuard())
    async updateUserInTeam(@Headers() headers: any, @Param() param: any, @Response() res: any, @Body() body: any) {
        // The user id to update
        const userId = param.id;

        // The admin id who want to update the user
        const adminId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!adminId) {
            throw new UnauthorizedException();
        }

        // An array of current teams information
        let currentUserTeamData = null;
        try {
            const currentTeamRes = await this.teamService.getCurrentTeam(adminId);
            currentUserTeamData = (currentTeamRes.data.user_team || [])[0] || null;
        } catch (err) {
            console.log(err);
        }

        if (currentUserTeamData === null) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }

        // The id of the current admin's team
        const adminTeamId = (currentUserTeamData.team || {}).id;

        if (!adminTeamId) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }

        // Check the user who what to update is ADMIN and ACTIVE
        const checkAdminIsAdmin =
            (currentUserTeamData.role_collaboration || {}).title === this.roleCollaborationService.ROLES.ROLE_ADMIN;
        const checkAdminIsActive = currentUserTeamData.is_active || false;

        if (!checkAdminIsAdmin || !checkAdminIsActive) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }

        // Retreive all the team information of the user who will be updated
        let userTeam = null;
        try {
            const userDataByTeamData = await this.userService.getUserDataByTeam(userId, adminTeamId);
            userTeam = ((userDataByTeamData.data.user[0] || {}).user_teams || [])[0] || null;
        } catch (err) {
            console.log(err);
        }

        if (userTeam === null) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }

        const userIsAdmin =
            (userTeam.role_collaboration || {}).title === this.roleCollaborationService.ROLES.ROLE_ADMIN;
        const userIsActive = userTeam.is_active || false;

        // Retreive all the user information of the user who will be updated
        let user = null;
        try {
            user = await this.userService.getUserById(userId);
        } catch (err) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }

        if (!user) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
        }

        const newUserData: any = {
            username: body.username,
            email: body.email,
            isActive: body.isActive,
            roleName: body.roleName,
        };

        const userData = {
            username: user.username,
            email: user.email,
            isActive: userIsActive,
            roleName: userIsAdmin
                ? this.roleCollaborationService.ROLES.ROLE_ADMIN
                : this.roleCollaborationService.ROLES.ROLE_MEMBER,
        };
        Object.keys(userData).forEach(prop => {
            const newValue = newUserData[prop];
            userData[prop] = typeof newValue === 'undefined' || newValue === null ? userData[prop] : newValue;
        });

        try {
            await this.userService.updateUserInTeam(adminId, adminTeamId, userId, userData);

            if (adminId === userId) {
                let userUpdated = null;
                try {
                    userUpdated = await this.userService.getUserById(userId);
                } catch (err) {
                    console.log(err);
                }

                if (!userUpdated) {
                    return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.UPDATE_USER_FAILED' });
                }

                return res.status(HttpStatus.OK).json(this.userService.getPublicUserData(userUpdated));
            }

            return res.status(HttpStatus.OK).json({ mesage: 'SUCCESS.USER.UPDATE_USER' });
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }
}
