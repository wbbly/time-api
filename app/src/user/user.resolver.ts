import { Resolver, Query } from '@nestjs/graphql';

import { UserService } from './user.service';

@Resolver()
export class UserResolver {
    constructor(private userService: UserService) {}
    @Query()
    users() {
        return this.userService.findAll();
    }
}
