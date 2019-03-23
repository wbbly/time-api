import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { AuthenticationError } from 'apollo-server-core';

import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserService } from './../user/user.service';
import { User } from './../user/user.entity';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService, private readonly jwtService: JwtService) {}

    async validateUserByPassword(email: string, password: string): Promise<User> {
        const user = await this.userService.findByEmail(email);
        if (user) {
            if (user.comparePassword(password)) {
                return user;
            }

            throw new AuthenticationError('Invalit credentials');
        }

        throw new AuthenticationError('Could not log-in with the provided credentials');
    }

    createJwt(user: User): { email: string; token: string } {
        const data: JwtPayload = {
            email: user.email,
            isAdmin: user.isAdmin(),
        };
        const jwt = this.jwtService.sign(data);

        return {
            email: user.email,
            token: jwt,
        };
    }

    async validateJwtPayload(payload: JwtPayload): Promise<User | undefined> {
        const user = await this.userService.findByEmail(payload.email);

        if (user) {
            return user;
        }

        return undefined;
    }
}
