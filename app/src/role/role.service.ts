import { Injectable } from '@nestjs/common';

@Injectable()
export class RoleService {
    ROLES = {
        ROLE_USER: 'ROLE_USER',
        ROLE_ADMIN: 'ROLE_ADMIN',
    };

    constructor() {}
}
