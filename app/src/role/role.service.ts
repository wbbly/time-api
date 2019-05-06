import { Injectable } from '@nestjs/common';

@Injectable()
export class RoleService {
    ROLES = {
        ROLE_ADMIN: 'ROLE_ADMIN',
        ROLE_USER: 'ROLE_USER',
    };

    ROLES_IDS = {
        ROLE_ADMIN: '00000000-0000-0000-0000-000000000000',
        ROLE_USER: '00000000-0000-0000-0000-000000000001',
    };

    constructor() {}
}
