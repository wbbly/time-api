import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';
import * as uuid from 'uuid';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';

@Injectable()
export class TeamService {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly roleCollaborationService: RoleCollaborationService
    ) {}

    DEFAULT_TEAMS = {
        MY_TEAM: 'My team',
    };

    async createTeam(userId: string, teamName: string = this.DEFAULT_TEAMS.MY_TEAM) {
        const insertTeamQuery = `mutation {
            insert_team(
                objects: [
                    {
                        name: "${teamName}"
                    }
                ]
            ) {
                returning {
                    id
                }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(insertTeamQuery).subscribe((insertTeamRes: AxiosResponse) => {
                const returningRows = insertTeamRes.data.insert_team.returning;

                if (returningRows.length) {
                    const teamId = insertTeamRes.data.insert_team.returning[0].id;

                    // @TODO: Change Hardcoded project color ID
                    const insertDefaultProject = `mutation {
                        insert_project_v2(
                            objects: [
                                {
                                    name: "any",
                                    project_color_id: "a642f337-9082-4f64-8ace-1d0e99fa7258",
                                    team_id: "${teamId}"
                                }
                            ]
                        ){
                            returning {
                                id
                            }
                        }
                    }`;

                    // Linking user with the team
                    const insertUserTeamQuery = `mutation {
                            insert_user_team(
                                objects: [
                                    {
                                        user_id: "${userId}"
                                        team_id: "${teamId}"
                                        role_collaboration_id: "${this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN}"
                                        is_active: true
                                        current_team: false
                                    }
                                ]
                            ) {
                                returning {
                                    id
                                }
                            }
                        }`;

                    this.httpRequestsService.request(insertDefaultProject).subscribe(
                        (insertProjectRes: AxiosResponse) => {
                            this.httpRequestsService.request(insertUserTeamQuery).subscribe(
                                async (insertUserTeamRes: AxiosResponse) => {
                                    try {
                                        await this.switchTeam(userId, teamId);
                                        resolve(insertUserTeamRes);
                                    } catch (switchTeamError) {
                                        reject(switchTeamError);
                                    }
                                },
                                (insertUserTeamError: AxiosError) => reject(insertUserTeamError)
                            );
                        },
                        (insertUserTeamError: AxiosError) => reject(insertUserTeamError)
                    );
                } else {
                    reject({
                        error: 'Failed to create association',
                    });
                }
            });
        });
    }

    async inviteMemberToTeam(userId: string, teamId: string, invitedUserId: string) {
        const checkIfTeamAdminQuery = `{
            user_team(where: {
                user_id: { _eq: "${userId}" },
                team_id: { _eq: "${teamId}"}
            }) {
                role_collaboration{
                    id
                }
            }
        }
        `;

        const checkIfAlreadyMemberQuery = `{
            user_team(where: {
                user_id: { _eq: "${invitedUserId}" }
                team_id: { _eq: "${teamId}"}
            }) {
                id
            }
        }`;

        return new Promise((resolve, reject) => {
            const insertUserTeamQuery = `mutation {
                insert_user_team(
                    objects: [
                        {
                            user_id: "${invitedUserId}"
                            team_id: "${teamId}"
                            role_collaboration_id: "${this.roleCollaborationService.ROLES_IDS.ROLE_MEMBER}"
                            is_active: false
                            current_team: false
                            invite_hash: "${uuid.v4()}"
                        }
                    ]
                ) {
                    returning {
                        invite_hash
                        user_id
                    }
                }
            }
            `;

            this.httpRequestsService.request(checkIfTeamAdminQuery).subscribe(
                (checkResponse: AxiosResponse) => {
                    let admin = false;
                    let alreadyMember = false;
                    // Check if the requester is admin in the team
                    if (
                        checkResponse.data.user_team[0].role_collaboration.id ===
                        this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN
                    ) {
                        admin = true;
                    }

                    this.httpRequestsService.request(checkIfAlreadyMemberQuery).subscribe(
                        (checkRes: AxiosResponse) => {
                            if (checkRes.data.user_team[0]) {
                                alreadyMember = true;
                            }

                            if (admin && !alreadyMember) {
                                this.httpRequestsService
                                    .request(insertUserTeamQuery)
                                    .subscribe(
                                        (insertRes: AxiosResponse) => resolve(insertRes),
                                        (insertError: AxiosError) => reject(insertError)
                                    );
                            } else {
                                reject({
                                    error: alreadyMember ? 'User already in team' : 'Not Authorized',
                                });
                            }
                        },
                        (checkError: AxiosError) => reject(checkError)
                    );
                },
                (checkError: AxiosError) => reject(checkError)
            );
        });
    }

    async acceptInvitation(teamId: string, inviteId: string) {
        const getUserIdByInvitationQuery = `{
            user_team (
                where: {
                    invite_hash: { _eq: "${inviteId}" }
                    team_id: { _eq: "${teamId}" }
                }
            ) {
                user_id
            }
        }`;

        const acceptInvitationQuery = `mutation {
            update_user_team(
                where: {
                    invite_hash: { _eq: "${inviteId}" }
                    team_id: { _eq: "${teamId}" }
                }
                _set: {
                    is_active: true
                    invite_hash: null
                }
            ) {
                returning {
                    is_active
                }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(getUserIdByInvitationQuery).subscribe(
                async (getUserIdByInvitationQueryRes: AxiosResponse) => {
                    const userTeam = getUserIdByInvitationQueryRes.data.user_team;
                    const userId = (userTeam[0] || {}).user_id;
                    try {
                        await this.switchTeam(userId, teamId);
                        this.httpRequestsService
                            .request(acceptInvitationQuery)
                            .subscribe(
                                (acceptInvitationQueryRes: AxiosResponse) => resolve(acceptInvitationQueryRes),
                                (acceptInvitationQueryError: AxiosError) => reject(acceptInvitationQueryError)
                            );
                    } catch (switchTeamError) {
                        reject(switchTeamError);
                    }
                },
                (getUserIdByInvitationQueryError: AxiosError) => reject(getUserIdByInvitationQueryError)
            );
        });
    }

    async getCurrentTeam(userId: string) {
        const getCurrentTeamQuery = `{
            user_team(where: {
                user_id: { _eq: "${userId}" },
                current_team: { _eq: true}
            }) {
                team {
                    id
                    name
                }
                role_collaboration_id
                role_collaboration {
                    title
                }
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(getCurrentTeamQuery)
                .subscribe(
                    (getCurrentTeamRes: AxiosResponse) => resolve(getCurrentTeamRes),
                    (getCurrentTeamError: AxiosError) => reject(getCurrentTeamError)
                );
        });
    }

    async getTeamData(teamId: string) {
        const query = `{
            team(
                where: {
                    id: { _eq: "${teamId}"}
                }
            ){
                id
                name
                team_users{
                    user{
                        id
                        username
                        email
                    }
                    role_collaboration{
                        title
                    }
                    is_active
                }
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe(
                    (queryRes: AxiosResponse) => resolve(queryRes),
                    (queryError: AxiosError) => reject(queryError)
                );
        });
    }

    async getTeamList() {
        const query = `{
            team{
                id
                name
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe(
                    (queryRes: AxiosResponse) => resolve(queryRes),
                    (queryError: AxiosError) => reject(queryError)
                );
        });
    }

    async getAllUserTeams(userId: string) {
        const query = `{
            user_team(where: {user_id: {_eq: "${userId}"}, is_active: {_eq: true}}) {
                team {
                    id
                    name
                }
            }
        }
        `;
        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe(
                    (queryRes: AxiosResponse) => resolve(queryRes),
                    (queryError: AxiosError) => reject(queryError)
                );
        });
    }

    async switchTeam(userId: string, teamId: string) {
        // 1) Set all teams which user posess to false
        // 2) Set current_team of teamId to true
        const setAllCurrentTeamsToFalse = `mutation{
            update_user_team(
                where: {
                    user_id: { _eq: "${userId}" }
                }
                _set: {
                    current_team: false
                }
            ) {
                returning {
                    current_team
                }
            }
        }`;

        const switchCurrentTeamQuery = `mutation {
            update_user_team(
                where: {
                    user_id: { _eq: "${userId}" }
                    team_id: { _eq: "${teamId}" }
                }
                _set: {
                    current_team: true
                }
            ) {
                returning {
                    current_team
                }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(setAllCurrentTeamsToFalse).subscribe(
                (setAllCurrentTeamsToFalseRes: AxiosResponse) => {
                    this.httpRequestsService
                        .request(switchCurrentTeamQuery)
                        .subscribe(
                            (switchCurrentTeamQueryRes: AxiosResponse) => resolve(switchCurrentTeamQueryRes),
                            (switchCurrentTeamQueryError: AxiosError) => reject(switchCurrentTeamQueryError)
                        );
                },
                (setAllCurrentTeamsToFalseError: AxiosError) => reject(setAllCurrentTeamsToFalseError)
            );
        });
    }

    async renameTeam(teamId: string, newName: string) {
        const renameTeamQuery = `mutation{
            update_team(
                where: {
                    id: { _eq: "${teamId}" }
                }
                _set: {
                    name: "${newName}"
                }
            ) {
                returning {
                    id
                    name
                }
            }
        }
        `;
        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(renameTeamQuery)
                .subscribe(
                    (renameTeamRes: AxiosResponse) => resolve(renameTeamRes),
                    (renameTeamError: AxiosError) => reject(renameTeamError)
                );
        });
    }

    async getTeamUserRole(teamId: string, userId: string) {
        const checkIfTeamAdminQuery = `{
            user_team(where: {
                user_id: { _eq: "${userId}" },
                team_id: { _eq: "${teamId}"}
            }) {
                role_collaboration{
                    id
                    title
                }
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(checkIfTeamAdminQuery)
                .subscribe(
                    (checkRes: AxiosResponse) => resolve(checkRes),
                    (checkError: AxiosError) => reject(checkError)
                );
        });
    }
}
