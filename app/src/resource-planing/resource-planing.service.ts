import { Injectable } from '@nestjs/common';

import { AxiosResponse, AxiosError } from 'axios';
import moment from 'moment';

import { PlanResource } from './interfaces/resource-planing.interface';
import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { TeamService } from '../team/team.service';
import { TimeService } from '../time/time.service';

@Injectable()
export class ResourcePlaningService {
    constructor(
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly httpRequestsService: HttpRequestsService,
        private readonly timeService: TimeService
    ) {}

    async createResource(data: {
        userId: string;
        projectId: string;
        userTimeOffId: string;
        totalDuration: string;
        startDate: string;
        endDate: string;
        createdById: string;
    }): Promise<AxiosResponse | AxiosError> {
        const { userId, projectId, userTimeOffId, totalDuration, startDate, endDate, createdById } = data;

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
                            project_id: ${projectId ? '"' + projectId + '"' : null},
                            user_time_off_id: ${userTimeOffId ? '"' + userTimeOffId + '"' : null},
                            created_by_id: "${createdById}",
                            team_id: "${currentTeamData.data.user_team[0].team.id}",
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
                this.httpRequestsService
                    .request(query)
                    .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
            });
        } else {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    async getResourceById(id: string): Promise<PlanResource | AxiosError> {
        return new Promise((resolve, reject) => {
            const query = `{
                plan_resource(
                    where: {
                        id: {_eq: "${id}"}
                    },
                ) {
                    id
                    user_id
                    project_id
                    user_time_off_id
                    team_id
                    total_duration
                    start_date
                    end_date
                    created_at
                    modified_at
                    created_by_id
                }
            }
            `;

            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const resource = res.data.plan_resource.shift();

                    return resolve(resource);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async updateResource(
        id: string,
        data: {
            projectId: string;
            userId: string;
            totalDuration: number;
            startDate: string;
            endDate: string;
            userTimeOffId: string;
        },
        updatedById: string
    ): Promise<AxiosResponse | AxiosError> {
        const { projectId, totalDuration, startDate, endDate, userId, userTimeOffId } = data;

        const currentTeamData: any = await this.teamService.getCurrentTeam(updatedById);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            const query = `mutation {
                update_plan_resource(
                    where: {
                        id: {_eq: "${id}"}
                    },
                    _set: {
                        user_id: "${userId}",
                        project_id: ${projectId ? '"' + projectId + '"' : null},
                        user_time_off_id: ${userTimeOffId ? '"' + userTimeOffId + '"' : null},
                        team_id: "${currentTeamData.data.user_team[0].team.id}",
                        total_duration: "${totalDuration}",
                        start_date: "${startDate}",
                        end_date: "${endDate}",
                        modified_at: "${this.timeService.getISOTime()}",
                    }
                ) {
                    returning {
                        id
                        user_id
                        project_id
                        user_time_off_id
                        team_id
                        total_duration
                        start_date
                        end_date
                        created_at
                        modified_at
                        created_by_id
                    }
                }
            }`;

            return new Promise(async (resolve, reject) => {
                this.httpRequestsService
                    .request(query)
                    .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
            });
        } else {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    async deleteResourceById(id: string, userId: string): Promise<AxiosResponse | AxiosError> {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            const query = `mutation {
                delete_plan_resource(where: {id: {_eq: "${id}"}}) {
                    affected_rows
                }
            }`;

            return new Promise(async (resolve, reject) => {
                this.httpRequestsService
                    .request(query)
                    .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
            });
        } else {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    async getResourceList(userIds: any, startDate: string, endDate: string): Promise<any> {
        const weekPeriods = this.splitDateRangeToWeekPeriods(startDate, endDate);
        const { weeks, weeksNormalized } = weekPeriods;

        const resourceListUserData = [];
        weeks.forEach((week: any) => {
            resourceListUserData.push({
                startDate: week.start,
                endDate: week.end,
                weekNumber: week.weekNumber,
                plan: [],
            });
        });

        const resourceListUsersData = {};
        userIds.forEach((id: string) => (resourceListUsersData[id] = { data: resourceListUserData }));

        for (const weekNormalized of weeksNormalized) {
            try {
                const res = (await this.getUsersResourcesByWeekPeriod(
                    weekNormalized.start,
                    weekNormalized.end,
                    userIds.map((id: string) => `"${id}"`)
                )) as AxiosResponse;

                const planResourceList = res.data.plan_resource;
                planResourceList.forEach((userPlanResource: any) => {
                    const { start_date: startDate, user_id: userId } = userPlanResource;
                    const weekNumber = moment(startDate, 'YYYY-MM-DDTHH:mm:ss').week();

                    resourceListUsersData[userId].data.forEach((dataObj: any) => {
                        dataObj.weekNumber === weekNumber ? dataObj.plan.push(userPlanResource) : null;
                    });
                });
            } catch (error) {
                console.log(error);
            }
        }

        return Promise.resolve(resourceListUsersData);
    }

    private async getUsersResourcesByWeekPeriod(
        startDate: string,
        endDate: string,
        userIds: any
    ): Promise<AxiosResponse | AxiosError> {
        // get the current team of the first user from list
        const currentTeamData: any = await this.teamService.getCurrentTeam(userIds[0]);

        const query = `query{
            plan_resource(
                where: {
                    team_id: {_eq: "${currentTeamData.data.user_team[0].team.id}"} 
                    user_id: {_in: ${userIds}}, 
                    _and: [
                        {start_date: {_gte: "${startDate}", _lte: "${endDate}"}},
                        {end_date: {_gte: "${startDate}", _lte: "${endDate}"}},
                    ]
                },
                order_by: {start_date: asc}
            ) {
                id
                user_id
                project_id
                user_time_off_id
                team_id
                total_duration
                start_date
                end_date
                created_at
                modified_at
                created_by_id
            }
        }`;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    private splitDateRangeToWeekPeriods(start: string, end: string) {
        const weeks = [];
        const weeksNormalized = [];

        let current = moment(start)
            .endOf('week')
            .startOf('day');
        while (current.isBefore(moment(end))) {
            weeks.push(this.getWeekPeriodByDate(current));
            weeksNormalized.push(this.getWeekPeriodByDate(current));
            current = current.add(7, 'days');
        }

        weeks.push(this.getWeekPeriodByDate(current));
        weeksNormalized.push(this.getWeekPeriodByDate(current));

        weeksNormalized[0].start = moment(start)
            .startOf('day')
            .format('YYYY-MM-DDTHH:mm:ss');
        weeksNormalized.slice(-1)[0].end = moment(end)
            .endOf('day')
            .format('YYYY-MM-DDTHH:mm:ss');

        return {
            weeks,
            weeksNormalized,
        };
    }

    private getWeekPeriodByDate(date: any) {
        const startOfWeek = moment(date)
            .startOf('week')
            .startOf('day')
            .format('YYYY-MM-DDTHH:mm:ss');
        const endOfWeek = moment(date)
            .endOf('week')
            .endOf('day')
            .format('YYYY-MM-DDTHH:mm:ss');
        const weekNumber = moment(date, 'YYYY-MM-DDTHH:mm:ss').week();

        return {
            start: startOfWeek,
            end: endOfWeek,
            weekNumber: weekNumber,
        };
    }
}
