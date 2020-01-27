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
        userId: string;
        projectId: string;
        teamId: string;
        createdById: string;
        totalDuration: string;
        startDate: string;
        endDate: string;
        timeOffType: string;
    }): Promise<AxiosResponse | AxiosError> {
        const { userId, projectId, teamId, createdById, totalDuration, startDate, endDate, timeOffType } = data;

        
                query = `mutation {
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