import { Injectable } from '@nestjs/common';

import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TeamService } from "../team/team.service";
import { RoleCollaborationService } from "../role-collaboration/role-collaboration.service";

@Injectable()
export class TimeOffDayService {

    constructor(
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly httpRequestsService: HttpRequestsService,
    ) { }
    
    async createTimeOffDay(data: {
        createdById: string,
        timeOffType: string;
        teamId: string;
        isActive: boolean;
    }): Promise<AxiosResponse | AxiosError> {
        const { teamId, createdById, timeOffType, isActive } = data;

        const currentTeamData: any = await this.teamService.getCurrentTeam(createdById);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;
        
        if (isAdmin) {
            const query = `mutation {
                insert_time_off_day(
                    objects: [
                        {
                            time_off_type: "${timeOffType}",
                            team_id: "${teamId}",
                            isActive: ${isActive},
                        }
                    ]
                ){
                    returning {
                        id
                        time_off_type
                        created_at
                        modified_at
                        team_id
                        isActive
                    }
                }
            }`;

            return new Promise((resolve, reject) => {
                this.httpRequestsService.request(query).subscribe(
                    async (insertTimeOffDayRes: AxiosResponse) => {
                        const returningRows = insertTimeOffDayRes.data.insert_time_off_day.returning[0];
                        if (returningRows) {
                            return resolve(returningRows);
                        } else {
                            return Promise.reject({
                                message: 'ERROR.TIME_OFF_DAY.CREATE_TIME_OFF_DAY_REQUEST_TIMEOUT',
                            });
                        }
                    },
                    (insertTimeOffDayError: AxiosError) => reject(insertTimeOffDayError)
                );
            });
        } else {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }
}