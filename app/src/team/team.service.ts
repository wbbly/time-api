import { Injectable } from '@nestjs/common';
import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { AxiosResponse, AxiosError } from 'axios';

@Injectable()
export class TeamService {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly roleCollaborationService: RoleCollaborationService
    ) {}

    DEFAULT_TEAMS = {
        MY_TEAM: 'my team',
    };

    DEFAULT_TEAMS_IDS = {
        DEFAULT: '00000000-0000-0000-0000-000000000000',
    };

    async createDefaultTeam(userId: string) {
        const insertTeamQuery = `mutation {
            insert_team(
                objects: [
                    {
                        name: "${this.DEFAULT_TEAMS.MY_TEAM}"
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

                    //Linking user with the team
                    const insertUserTeamQuery = `mutation {
                            insert_user_team(
                                objects: [
                                    {
                                        user_id: "${userId}"
                                        team_id: "${teamId}"
                                        role_collaboration_id: "${this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN}"
                                        is_active: true
                                        current_team: true
                                    }
                                ]
                            ) {
                                returning {
                                    id
                                }
                            }
                        }`;

                    this.httpRequestsService
                        .request(insertUserTeamQuery)
                        .subscribe(
                            (insertUserTeamRes: AxiosResponse) => resolve(insertUserTeamRes),
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

    async switchTeam(userId: string, teamId: string) {
        //1) Set all teams which user posess to false
        //2) Set current_team of teamId to true
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
                (falsifyRes: AxiosResponse) => {
                    this.httpRequestsService
                        .request(switchCurrentTeamQuery)
                        .subscribe(
                            (switchTeamRes: AxiosResponse) => resolve(switchTeamRes),
                            (switchTeamError: AxiosError) => reject(switchTeamError)
                        );
                },
                (falsifyError: AxiosError) => reject(falsifyError)
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
}
