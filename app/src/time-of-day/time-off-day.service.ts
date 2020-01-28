import { Injectable } from '@nestjs/common';

import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TeamService } from '../team/team.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { TimeOffDay } from './interfaces/time-off-day.interface';
import { TimeService } from '../time/time.service';

@Injectable()
export class TimeOffDayService {
    constructor(
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly httpRequestsService: HttpRequestsService,
        private readonly timeService: TimeService
    ) {}

    async createTimeOffDay(data: {
        createdById: string;
        timeOffType: string;
        isActive: boolean;
    }): Promise<AxiosResponse | AxiosError> {
        const { createdById, timeOffType, isActive } = data;

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
                            team_id: "${currentTeamData.data.user_team[0].team.id}",
                            is_active: ${isActive},
                        }
                    ]
                ){
                    returning {
                        id
                        time_off_type
                        created_at
                        modified_at
                        team_id
                        is_active
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

    async getTimeOffDayById(id: string): Promise<TimeOffDay | AxiosError> {
        const whereStatements = [`id: { _eq: "${id}" }`];

        return new Promise((resolve, reject) => {
            this.getTimeOffDayData(whereStatements.join(',')).then(
                (res: TimeOffDay) => resolve(res),
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getTimeOffDayData(whereStatement: string): Promise<any | null | AxiosError> {
        const query = `{
            time_off_day(where: {${whereStatement}}) {
                id
                time_off_type
                team_id
                is_active
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const resource = res.data.time_off_day.shift();
                    return resolve(resource);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }
    async updateTimeOffDay(
        timeOffId: string,
        data: {
            timeOffType: string;
            isActive: boolean;
        },
        updatedById: string
    ): Promise<AxiosResponse | AxiosError> {
        const { timeOffType, isActive } = data;
        const currentTeamData: any = await this.teamService.getCurrentTeam(updatedById);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            const query = `mutation {
                update_time_off_day(
                    where: {
                        id: {_eq: "${timeOffId}"}
                    },
                    _set: {
                        time_off_type: "${timeOffType}",
                        modified_at: "${this.timeService.getISOTime()}",
                        is_active: ${isActive},
                    }
                ) {
                    returning {
                        id
                        created_at
                        time_off_type
                        modified_at
                        team_id
                        is_active
                    }
                }
            }`;

            return new Promise(async (resolve, reject) => {
                this.httpRequestsService.request(query).subscribe(
                    async (insertTimeOffDayRes: AxiosResponse) => {
                        const returningRows = insertTimeOffDayRes.data.update_time_off_day.returning[0];
                        if (returningRows) {
                            return resolve(returningRows);
                        } else {
                            return Promise.reject({
                                message: 'ERROR.TIME_OFF_DAY.UPDATE_TIME_OFF_DAY_REQUEST_TIMEOUT',
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

    async deleteTimeOffDayById(timeOffDayId: string, userId: string): Promise<AxiosResponse | AxiosError> {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            const query = `mutation {
                delete_time_off_day(where: {id: {_eq: "${timeOffDayId}"}}) {
                    affected_rows
                }
            }`;

            return new Promise(async (resolve, reject) => {
                this.httpRequestsService.request(query).subscribe(
                    async (insertTimeOffDayRes: AxiosResponse) => {
                        const returningRows = insertTimeOffDayRes.data.delete_time_off_day;
                        if (returningRows) {
                            return resolve(returningRows);
                        } else {
                            return Promise.reject({
                                message: 'ERROR.TIME_OFF_DAY.DELETE_TIME_OFF_DAY_REQUEST_TIMEOUT',
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

    async getTimeOffDayList(userId: string): Promise<AxiosResponse | AxiosError> {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;
        console.log(currentTeamData.data.user_team[0].team.id);

        if (isAdmin) {
            const query = `{
                time_off_day(where: {team_id: {_eq: "${
                    currentTeamData.data.user_team[0].team.id
                }"}}, order_by: {created_at: asc}) {
                        id
                        created_at
                        time_off_type
                        modified_at
                        team_id
                        is_active
                    }
                }
            `;

            return new Promise(async (resolve, reject) => {
                this.httpRequestsService.request(query).subscribe(
                    async (insertTimeOffDayRes: AxiosResponse) => {
                        const returningRows = insertTimeOffDayRes.data.time_off_day;
                        if (returningRows) {
                            return resolve(returningRows);
                        } else {
                            return Promise.reject({
                                message: 'ERROR.TIME_OFF_DAY.LIST_TIME_OFF_DAY_REQUEST_TIMEOUT',
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
