import { Controller, Post, HttpStatus, Response, Body } from '@nestjs/common';

import { UserService } from '../user/user.service';
import { User } from './interfaces/user.interface';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('login')
    async loginUser(@Response() res: any, @Body() body: User) {
        if (!(body && body.email && body.password)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email and password are required!' });
        }

        let user = null;
        try {
            user = await this.userService.getUser({ email: body.email });
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
    async registerUser(@Response() res: any, @Body() body: User) {
        if (!(body && body.email && body.password)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email, password and role are required!' });
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
                roleId: body.roleId,
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
}
