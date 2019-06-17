import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';
import * as uuid from 'uuid';
import * as bcrypt from 'bcrypt';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { TeamService } from '../team/team.service';
import { AuthService } from '../auth/auth.service';
import { User } from './interfaces/user.interface';

const APP_VERSION = 'v1.0.4';

@Injectable()
export class UserService {
    private salt = 10;

    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly teamService: TeamService,
        private readonly authService: AuthService
    ) {}

    getUserList() {
        const query = `{
            user(order_by: {username: asc}) {
                    id,
                    username,
                    email,
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
            this.getUserData(whereStatements.join(',')).then(
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
            this.getUserData(whereStatements.join(',')).then(
                (res: User) => resolve(res),
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getUserByResetPasswordHash(token: string, isActive: boolean = true): Promise<User | AxiosError> {
        const whereStatements = [`reset_password_hash: { _eq: "${token}" }`];

        if (isActive) {
            whereStatements.push(`is_active: { _eq: true } `);
        }

        return new Promise((resolve, reject) => {
            this.getUserData(whereStatements.join(',')).then(
                (res: User) => resolve(res),
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getUserData(whereStatement: string): Promise<any | null | AxiosError> {
        const query = `{
            user(where: {${whereStatement}}) {
                id
                username
                email
                password
                timezone_offset
            }
        }
        `;

        let user: any = null;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const data = res.data.user.shift();
                    if (data) {
                        const { id: userId, username, email, password, timezone_offset: timezoneOffset } = data;

                        user = {
                            id: userId,
                            username,
                            email,
                            password,
                            timezoneOffset,
                        };
                    }

                    return resolve(user);
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

                    return resolve(users.length > 0);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getUserDataByTeam(id: string, teamId: string): Promise<AxiosResponse> {
        const query = `{
            user(where: {id: {_eq: "${id}"}}) {
                user_teams(where: {team_id: {_eq: "${teamId}"}}) {
                    is_active
                    role_collaboration_id
                    role_collaboration {
                        title
                    }
                }
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
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
                        is_active: true
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
                        try {
                            this.teamService.createTeam(userId);
                        } catch (error) {
                            console.log(error);
                        }

                        return resolve(insertUserRes);
                    } else {
                        return resolve(insertUserRes);
                    }
                },
                (insertUserError: AxiosError) => reject(insertUserError)
            );
        });
    }

    async updateUser(
        adminId: string,
        teamId: string,
        userId: string,
        data: {
            username: string;
            email: string;
            isActive: boolean;
            roleName: string;
        }
    ): Promise<AxiosResponse | AxiosError> {
        const { username, email, isActive, roleName } = data;

        const roleId =
            roleName === this.roleCollaborationService.ROLES.ROLE_ADMIN
                ? this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN
                : this.roleCollaborationService.ROLES_IDS.ROLE_MEMBER;

        const query = `mutation {
            update_user(
                where: {
                    id: {_eq: "${userId}"},
                    user_teams: {team_id: {_eq: "${teamId}"}}
                },
                _set: {
                    username: "${username}"
                    email: "${email}"
                }
            ) {
                returning {
                    id
                }
            }
        }`;

        const updateTeamRoleQuery = `mutation{
            update_user_team(
                where: {
                    user_id: { _eq: "${userId}"},
                    team_id: { _eq: "${teamId}"}
                },
                _set: {
                    role_collaboration_id: "${roleId}"
                    is_active: ${isActive}
                }
            ) {
                returning {
                    id
                    current_team
                }
            }
        }
        `;

        return new Promise(async (resolve, reject) => {
            let ownTeamList = [];
            try {
                const ownerUserTeams = await this.teamService.getOwnerUserTeams(userId);
                ownTeamList = ownerUserTeams.data.team;
                for (const ownTeam of ownTeamList) {
                    if (ownTeam.id === teamId && roleId === this.roleCollaborationService.ROLES_IDS.ROLE_MEMBER) {
                        if (adminId === userId) {
                            return reject({
                                message: "You can't be able to change the role in your own team",
                            });
                        } else {
                            return reject({
                                message: "You can't be able to change the team owner's role",
                            });
                        }
                    } else if (ownTeam.id === teamId && isActive === false) {
                        if (adminId === userId) {
                            return reject({
                                message: "You can't be able to set your account as inactive in your own team",
                            });
                        } else {
                            return reject({
                                message: "You can't be able to set team owner's account as inactive",
                            });
                        }
                    }
                }
            } catch (e) {
                const error: AxiosError = e;
                return reject(error);
            }

            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    this.httpRequestsService.request(updateTeamRoleQuery).subscribe(
                        async (updateTeamRoleQueryRes: AxiosResponse) => {
                            const returningRows = updateTeamRoleQueryRes.data.update_user_team.returning;
                            if (returningRows.length) {
                                const currentTeam = returningRows[0].current_team;

                                if (currentTeam && !isActive) {
                                    if (ownTeamList.length) {
                                        const lastOwnerTeam = ownTeamList[0];
                                        await this.teamService.switchTeam(userId, lastOwnerTeam.id);

                                        return resolve(updateTeamRoleQueryRes);
                                    } else {
                                        const resetCurrentTeamQuery = `mutation{
                                            update_user_team(
                                                where: {
                                                    user_id: { _eq: "${userId}"},
                                                    team_id: { _eq: "${teamId}"}
                                                },
                                                _set: {
                                                    current_team: false
                                                }
                                            ) {
                                                returning {
                                                    id
                                                }
                                            }
                                        }
                                        `;

                                        this.httpRequestsService
                                            .request(resetCurrentTeamQuery)
                                            .subscribe(
                                                (resetCurrentTeamQueryRes: AxiosResponse) =>
                                                    resolve(resetCurrentTeamQueryRes),
                                                (resetCurrentTeamQueryError: AxiosError) =>
                                                    reject(resetCurrentTeamQueryError)
                                            );
                                    }
                                } else {
                                    return resolve(updateTeamRoleQueryRes);
                                }
                            } else {
                                return resolve(updateTeamRoleQueryRes);
                            }
                        },
                        (updateTeamRoleQueryError: AxiosError) => reject(updateTeamRoleQueryError)
                    );
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async resetPassword(email: string): Promise<AxiosResponse> {
        return new Promise((resolve, reject) => {
            const resetPasswordQuery = `mutation {
                update_user(
                    where: {
                        email: {_eq: "${email}"}
                    },
                    _set: {
                        reset_password_hash: "${uuid.v4()}"
                    }
                ) {
                    returning {
                        id
                        reset_password_hash
                    }
                }
            }
            `;

            this.httpRequestsService
                .request(resetPasswordQuery)
                .subscribe(
                    (resetPasswordResponse: AxiosResponse) => resolve(resetPasswordResponse),
                    (resetPasswordError: AxiosError) => reject(resetPasswordError)
                );
        });
    }

    async setPassword(resetPasswordHash: string, password: string): Promise<AxiosResponse> {
        const passwordHash = await this.getHash(password);

        return new Promise((resolve, reject) => {
            const setPasswordQuery = `mutation {
                update_user(
                    where: {
                        reset_password_hash: {_eq: "${resetPasswordHash}"}
                    },
                    _set: {
                        reset_password_hash: null
                        password: "${passwordHash}"
                    }
                ) {
                    returning {
                        id
                        email
                    }
                }
            }
            `;

            this.httpRequestsService
                .request(setPasswordQuery)
                .subscribe(
                    (setPasswordResponse: AxiosResponse) => resolve(setPasswordResponse),
                    (setPasswordError: AxiosError) => reject(setPasswordError)
                );
        });
    }

    async changePassword(userId: string, newPassword: string): Promise<AxiosResponse> {
        const passwordHash = await this.getHash(newPassword);

        return new Promise((resolve, reject) => {
            const changePasswordQuery = `mutation {
                update_user(
                    where: {
                        id: {_eq: "${userId}"}
                    },
                    _set: {
                        password: "${passwordHash}"
                    }
                ) {
                    returning {
                        id
                        email
                    }
                }
            }
            `;

            this.httpRequestsService
                .request(changePasswordQuery)
                .subscribe(
                    (changePasswordResponse: AxiosResponse) => resolve(changePasswordResponse),
                    (changePasswordError: AxiosError) => reject(changePasswordError)
                );
        });
    }

    async signIn(user: User): Promise<any> {
        return await this.authService.signIn({
            id: user.id,
            username: user.username,
            email: user.email,
            timezoneOffset: user.timezoneOffset,

            // @TODO: replace with real application version
            appVersion: APP_VERSION,
        });
    }

    async getHash(password: string | undefined): Promise<string> {
        return bcrypt.hash(password, this.salt);
    }

    async compareHash(password: string | undefined, hash: string | undefined): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
