import { Injectable } from '@nestjs/common';

@Injectable()
export class RoleCollaborationService {
    ROLES = {
        ROLE_ADMIN: 'ROLE_ADMIN',
        ROLE_MEMBER: 'ROLE_MEMBER',
    };

    ROLES_IDS = {
        ROLE_ADMIN: '00000000-0000-0000-0000-000000000000',
        ROLE_MEMBER: '00000000-0000-0000-0000-000000000001',
    };

    constructor() {}
}
