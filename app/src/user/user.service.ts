import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';
import * as bcrypt from 'bcrypt';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { RoleService } from '../role/role.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { TeamService } from '../team/team.service';
import { User } from './interfaces/user.interface';

@Injectable()
export class UserService {
    private salt = 10;

    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly roleService: RoleService,
        private readonly teamService: TeamService
    ) {}

    getUserList() {
        const query = `{
            user(order_by: {username: asc}) {
                    id,
                    username,
                    email,
                    role {
                        title
                    },
                    is_active
                }
            }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getUserById(id: string, isActive: boolean = true): Promise<User | AxiosError> {
        const whereStatements = [`id: { _eq: "${id}" }`];

        if (isActive) {
            whereStatements.push(`is_active: { _eq: true } `);
        }

        return new Promise((resolve, reject) => {
            this.getUser(whereStatements.join(',')).then(
                (res: User) => resolve(res),
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getUserByEmail(email: string, isActive: boolean = true): Promise<User | AxiosError> {
        const whereStatements = [`email: { _eq: "${email}" }`];

        if (isActive) {
            whereStatements.push(`is_active: { _eq: true } `);
        }

        return new Promise((resolve, reject) => {
            this.getUser(whereStatements.join(',')).then(
                (res: User) => resolve(res),
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getUser(whereStatement: string): Promise<User | null | AxiosError> {
        const query = `{
            user(where: {${whereStatement}}) {
                id
                username
                email
                password
                is_active
                role_id
                role {
                    title
                },
                timezone_offset
            }
        }
        `;

        let user: User = null;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const data = res.data.user.shift();
                    if (data) {
                        const {
                            id: userId,
                            username,
                            email,
                            password,
                            is_active: isActive,
                            role_id: roleId,
                            role,
                            timezone_offset: timezoneOffset,
                        } = data;
                        const { title } = role;
                        user = {
                            id: userId,
                            username,
                            email,
                            password,
                            isActive,
                            roleId,
                            role: {
                                title,
                            },
                            timezoneOffset,
                        };
                    }

                    resolve(user);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async checkUserExists(data: { email: string }): Promise<boolean> {
        const { email } = data;

        const query = `{
            user(where: { email: { _eq: "${email}" } }) {
                id
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const users = res.data.user || [];
                    resolve(users.length > 0);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async checkUserIsAdmin(id: string): Promise<boolean> {
        const query = `{
            user(where: { id: { _eq: "${id}" }, role: { title: { _eq: "${this.roleService.ROLES.ROLE_ADMIN}" } } }) {
                id
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const users = res.data.user || [];
                    resolve(users.length > 0);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async createUser(data: { username: string; email: string; password: string }): Promise<AxiosResponse | AxiosError> {
        const { username, email, password } = data;
        const passwordHash = await this.getHash(password);

        const insertUserQuery = `mutation {
            insert_user(
                objects: [
                    {
                        username: "${username}"
                        email: "${email}",
                        password: "${passwordHash}",
                        role_id: "${this.roleService.ROLES_IDS.ROLE_USER}"
                    }
                ]
            ){
                returning {
                    id
                }
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(insertUserQuery).subscribe(
                (insertUserRes: AxiosResponse) => {
                    const returningRows = insertUserRes.data.insert_user.returning;
                    if (returningRows.length) {
                        const userId = insertUserRes.data.insert_user.returning[0].id;

                        // @TODO: WOB-71, get team_id and role_collaboration_id from parameters

                        try {
                            this.teamService.createDefaultTeam(userId);
                            // ^ 400 is thrown by Axios somewhere here
                        } catch (error) {
                            console.log(error);
                        }
                    } else {
                        resolve(insertUserRes);
                    }
                },
                (insertUserError: AxiosError) => reject(insertUserError)
            );
        });
    }

    async updateUser(
        id: string,
        data: {
            username: string;
            email: string;
            roleId: string;
            isActive: boolean;
        }
    ): Promise<AxiosResponse | AxiosError> {
        const { username, email, roleId, isActive } = data;

        const query = `mutation {
            update_user(
                where: {id: {_eq: "${id}"}},
                _set: {
                    username: "${username}"
                    email: "${email}",
                    role_id: "${roleId}",
                    is_active: ${isActive}
                }
            ) {
                returning {
                    id
                }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getHash(password: string | undefined): Promise<string> {
        return bcrypt.hash(password, this.salt);
    }

    async compareHash(password: string | undefined, hash: string | undefined): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
