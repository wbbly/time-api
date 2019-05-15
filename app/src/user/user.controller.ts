import { Controller, Get, Post, Patch, HttpStatus, Headers, Param, Response, Body } from '@nestjs/common';
import { AxiosError } from 'axios';

import { UserService } from '../user/user.service';
import { TeamService } from '../team/team.service';
import { User } from './interfaces/user.interface';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService, private readonly teamService: TeamService) {}

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
