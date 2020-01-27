import { Injectable } from '@nestjs/common';

import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { TeamService } from '../team/team.service';

@Injectable()
export class ResourcePlaningService {
    constructor(
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly httpRequestsService: HttpRequestsService
    ) {}

    async createPlanResource(data: {
        userId: string;
        projectId: string;
        teamId: string;
        createdById: string;
        totalDuration: string;
        startDate: string;
        endDate: string;
    }): Promise<AxiosResponse | AxiosError> {
        const { userId, projectId, teamId, createdById, totalDuration, startDate, endDate } = data;

        const currentTeamData: any = await this.teamService.getCurrentTeam(createdById);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            const query = `mutation {
                insert_plan_resource(
                    objects: [
                        {
                            user_id: "${userId}",
                            project_id: "${projectId}",
                            created_by_id: "${createdById}",
                            team_id: "${teamId}",
                            total_duration: "${totalDuration}",
                            start_date: "${startDate}",
                            end_date: "${endDate}"
                        }
                    ]
                ){
                    returning {
                        id
                    }
                }
            }`;

            return new Promise((resolve, reject) => {
                this.httpRequestsService.request(query).subscribe(
                    async (insertResourceRes: AxiosResponse) => {
                        const returningRows = insertResourceRes.data.plan_resource.returning;
                        if (returningRows.length) {
                            return resolve(insertResourceRes);
                        } else {
                            return Promise.reject({
                                message: 'ERROR.PLAN_RESOURCE.CREATE_PLAN_RESOURCE_REQUEST_TIMEOUT',
                            });
                        }
                    },
                    (insertResourceError: AxiosError) => reject(insertResourceError)
                );
            });
        } else {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }
}
