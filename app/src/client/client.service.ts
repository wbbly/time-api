import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TeamService } from '../team/team.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';

@Injectable()
export class ClientService {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService
    ) {}

    async getClientList(userId: string) {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            const query = `{
                client(
                    where: {
                        team_id: {
                            _eq: "${currentTeamId}"
                        }
                    }
                    order_by: {name: asc}
                ) {
                    id
                    name
                    project {
                        id
                        name
                    }
                }
            }`;

            return new Promise((resolve, reject) => {
                this.httpRequestsService
                    .request(query)
                    .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
            });
        } else {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    async addClient(userId: string, clientName: string) {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            const query = `mutation {
                insert_client(
                    objects: {
                        name: "${clientName}", 
                        team_id: "${currentTeamId}"
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
        } else {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    // async deleteClient(userId: string, clientId: string) {
    //     const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
    //     const isAdmin =
    //         currentTeamData.data.user_team[0].role_collaboration_id ===
    //         this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

    //     if (isAdmin) {
    //         const query = `mutation {
    //             delete_client(where: {id: {_eq: "${clientId}"}}) {
    //                 affected_rows
    //             }`;

    //         return new Promise((resolve, reject) => {
    //             this.httpRequestsService
    //                 .request(query)
    //                 .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
    //         });
    //     } else {
    //         return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
    //     }
    // }

    async patchClient(userId: string, clientId: string, clientName: string) {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            const query = `mutation {
                update_client(
                    where: {
                        id: {
                            _eq: "${clientId}"
                        },
                        team_id: {
                            _eq: "${currentTeamId}"
                        }
                    },
                    _set: {
                        name: "${clientName}"
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
        } else {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }
}
