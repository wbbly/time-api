import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticationError } from 'apollo-server-core';

import { UserService } from './../../user/user.service';

// Check if username in field for query matches authenticated user's username
// or if the user is admin
@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private usersService: UserService) {}

    canActivate(context: ExecutionContext): boolean {
        const ctx = GqlExecutionContext.create(context);
        const request = ctx.getContext().req;

        if (request.user && request.user.isAdmin()) {
            return true;
        }

        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
}
