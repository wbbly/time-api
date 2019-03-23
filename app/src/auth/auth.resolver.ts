import { Resolver, Args, Query, Mutation } from '@nestjs/graphql';
import { AuthenticationError } from 'apollo-server-core';

import { AuthService } from './auth.service';
import { UserService } from './../user/user.service';
import { LoginResult } from './interfaces/jwt-payload.interface';

@Resolver('Auth')
export class AuthResolver {
    constructor(private authService: AuthService, private userService: UserService) {}

    @Mutation('login')
    async login(@Args('email') email: string, @Args('password') password: string): Promise<LoginResult> {
        const user = await this.authService.validateUserByPassword(email, password);
        const token = this.authService.createJwt(user);

        if (token) {
            return token;
        }

        throw new AuthenticationError('Could not log-in with the provided credentials');
    }
}
