import { Injectable } from '@nestjs/common';

import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';


@Injectable()
export class TimeOffDayService {

    constructor(
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly httpRequestsService: HttpRequestsService,
        private readonly timeOffDayService: TimeOffDayService
    ) { }
    
    async createTimeOffDay(data: {
        createdById: string,
        timeOffType: string;
        teamId: string;
    }): Promise<AxiosResponse | AxiosError> {
        const { teamId, createdById, timeOffType } = data;

        const currentTeamData: any = await this.teamService.getCurrentTeam(createdById);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;
        
        if (isAdmin) {
            const query = ``;
            return new Promise((resolve, reject) => {
                this.httpRequestsService.request(query).subscribe(
                    async (insertResourceRes: AxiosResponse) => {
                        const returningRows = insertResourceRes.data.plan_resource.returning;
                        if (returningRows.length) {
                            return resolve(insertResourceRes);
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