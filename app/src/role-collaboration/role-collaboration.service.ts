import { Injectable } from '@nestjs/common';

@Injectable()
export class RoleCollaborationService {
    ROLES = {
        ROLE_ADMIN: 'ROLE_ADMIN',
        ROLE_MEMBER: 'ROLE_MEMBER',
        ROLE_OWNER: 'ROLE_OWNER',
        ROLE_INVOICES_MANAGER: 'INVOICES_MANAGER',
    };

    ROLES_IDS = {
        ROLE_ADMIN: '00000000-0000-0000-0000-000000000000',
        ROLE_MEMBER: '00000000-0000-0000-0000-000000000001',
        ROLE_OWNER: '00000000-0000-0000-0000-000000000002',
        ROLE_INVOICES_MANAGER: '00000000-0000-0000-0000-000000000003',
    };

    constructor() {}
}
