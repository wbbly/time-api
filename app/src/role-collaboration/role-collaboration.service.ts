import { Injectable } from '@nestjs/common';

@Injectable()
export class RoleCollaborationService {
    ROLES = {
        ROLE_MEMBER: 'ROLE_MEMBER',
        ROLE_ADMIN: 'ROLE_ADMIN',
    };

    constructor() {}
}
