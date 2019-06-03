import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';
import * as bcrypt from 'bcrypt';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { TeamService } from '../team/team.service';
import { User } from './interfaces/user.interface';

@Injectable()
export class UserService {
    private salt = 10;

    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly teamService: TeamService
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
            this.getUserPrimaryData(whereStatements.join(',')).then(
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
            this.getUserSecondaryData(whereStatements.join(',')).then(
                (res: User) => resolve(res),
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getUserPrimaryData(whereStatement: string): Promise<any | null | AxiosError> {
        const query = `{
            user(where: {${whereStatement}}) {
                id
                username
                email
                password
                is_active
                timezone_offset
                user_teams(where: {
                    current_team: {
                        _eq: true
                    },
                }){
                    role_collaboration{
                        title
                    }
                    role_collaboration_id
                }
            }
        }
        `;

        let user: any = null;

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
                            user_teams: userTeams,
                            timezone_offset: timezoneOffset,
                        } = data;

                        const {
                            role_collaboration: roleCollaboration,
                            role_collaboration_id: roleCollaborationId,
                        } = userTeams[0];
                        const { title: roleCollaborationTitle } = roleCollaboration;
                        user = {
                            id: userId,
                            username,
                            email,
                            password,
                            isActive,
                            roleCollaborationId,
                            roleCollaboration: {
                                title: roleCollaborationTitle,
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

    async getUserSecondaryData(whereStatement: string): Promise<any | null | AxiosError> {
        const query = `{
            user(where: {${whereStatement}}) {
                id
                username
                email
                password
                is_active
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
                        const {
                            id: userId,
                            username,
                            email,
                            password,
                            is_active: isActive,
                            timezone_offset: timezoneOffset,
                        } = data;

                        user = {
                            id: userId,
                            username,
                            email,
                            password,
                            isActive,
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
            user(where: 
              { 
                id: { _eq: "${id}" },
                
              }),  {
                          user_teams(where: {
                            current_team: { _eq: true }
                          }){
                              role_collaboration_id
                              role_collaboration{
                                  title
                              }
                          }
                      }
                  }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    if (res.data.user.length > 0) {
                        const admin =
                            res.data.user[0].user_teams[0].role_collaboration.title ===
                                this.roleCollaborationService.ROLES.ROLE_ADMIN || false;
                        resolve(admin);
                    } else resolve(false);
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
                        resolve(insertUserRes);
                    } else {
                        resolve(insertUserRes);
                    }
                },
                (insertUserError: AxiosError) => reject(insertUserError)
            );
        });
    }

    async updateUser(
        adminId: string,
        userId: string,
        data: {
            username: string;
            email: string;
            isActive: boolean;
            roleName: string;
            teamId: string;
        }
    ): Promise<AxiosResponse | AxiosError> {
        const { username, email, isActive, teamId, roleName } = data;

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
                                        resolve(updateTeamRoleQueryRes);
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
                                    resolve(updateTeamRoleQueryRes);
                                }
                            } else {
                                resolve(updateTeamRoleQueryRes);
                            }
                        },
                        (updateTeamRoleQueryError: AxiosError) => reject(updateTeamRoleQueryError)
                    );
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getHash(password: string | undefined): Promise<string> {
        return bcrypt.hash(password, this.salt);
    }

    async compareHash(password: string | undefined, hash: string | undefined): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
