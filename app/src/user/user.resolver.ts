import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';

import { UserService } from './user.service';
import { UserDTO } from './user.dto';
import { Guard, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/auth/guard/jwt.auth.guard';
import { AdminGuard } from 'src/auth/guard/admin.guard';

@Resolver()
export class UserResolver {
    constructor(private userService: UserService) { }

    @Query()
    @UseGuards(JwtAuthGuard, AdminGuard)
    users() {
        return this.userService.findAll();
    }

    @Mutation()
    register(@Args('email') email: string, @Args('password') password: string) {
        const user: UserDTO = { email, password }
        return this.userService.register(user)
    }
}
