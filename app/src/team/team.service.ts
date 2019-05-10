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
                                        team_id: "${teamId}",
                                        role_collaboration_id: "${this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN}"
                                        is_active: true
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
}
