import { Injectable } from '@nestjs/common';

import { AxiosResponse, AxiosError } from 'axios';
import moment from 'moment';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { TeamService } from '../team/team.service';
import { PlanResource } from './interfaces/resource-planing.interface';
import { TimeService } from '../time/time.service';

@Injectable()
export class ResourcePlaningService {
    constructor(
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly httpRequestsService: HttpRequestsService,
        private readonly timeService: TimeService
    ) {}

    async createPlanResource(data: {
        userId: string;
        projectId: string;
        createdById: string;
        totalDuration: string;
        startDate: string;
        endDate: string;
    }): Promise<AxiosResponse | AxiosError> {
        const { userId, projectId, createdById, totalDuration, startDate, endDate } = data;

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
                this.httpRequestsService.request(query).subscribe(
                    async (insertResourceRes: AxiosResponse) => {
                        const returningRows = insertResourceRes.data.insert_plan_resource.returning;
                        if (returningRows.length) {
                            return resolve(returningRows);
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

    async getResourceById(id: string): Promise<PlanResource | AxiosError> {
        const whereStatements = [`id: { _eq: "${id}" }`];

        return new Promise((resolve, reject) => {
            this.getResourceData(whereStatements.join(',')).then(
                (res: PlanResource) => resolve(res),
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getResourceData(whereStatement: string): Promise<any | null | AxiosError> {
        const query = `{
            plan_resource(where: {${whereStatement}}) {
                id
                created_at
                created_by_id
                end_date
                modified_at
                project_id
                start_date
                team_id
                total_duration
                user_id
                user_time_off_id
            }
        }
        `;

        let resource: any = null;

        return new Promise((resolve, reject) => {
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
        resourceId: string,
        data: {
            projectId: string;
            teamId: string;
            userId: string;
            totalDuration: number;
            startDate: string;
            endDate: string;
            userTimeOffId: string;
        },
        updatedById: string
    ): Promise<AxiosResponse | AxiosError> {
        const { projectId, teamId, totalDuration, startDate, endDate, userId, userTimeOffId } = data;
        const currentTeamData: any = await this.teamService.getCurrentTeam(updatedById);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            const query = `mutation {
                update_plan_resource(
                    where: {
                        id: {_eq: "${resourceId}"}
                    },
                    _set: {
                        end_date: "${endDate}",
                        modified_at: "${this.timeService.getISOTime()}",
                        project_id: ${projectId ? '"' + projectId + '"' : null},
                        start_date: "${startDate}",
                        team_id: "${teamId}",
                        total_duration: "${totalDuration}",
                        user_id: "${userId}",
                        user_time_off_id: ${userTimeOffId ? '"' + userTimeOffId + '"' : null},
                    }
                ) {
                    returning {
                        id
                        created_at
                        created_by_id
                        end_date
                        modified_at
                        project_id
                        start_date
                        team_id
                        total_duration
                        user_id
                        user_time_off_id
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

    async deleteResourceById(resourceId: string, userId: string): Promise<AxiosResponse | AxiosError> {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            const query = `mutation {
                delete_plan_resource(where: {id: {_eq: "${resourceId}"}}) {
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

    splitPeriodToWeeks(start: string, end: string) {
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

    getResourceByWeek(
        startDate: string,
        endDate: string,
        userIds: any,
        teamId: string
    ): Promise<AxiosResponse | AxiosError> {
        const query = `query{
            plan_resource(
                where: {
                    team_id: {_eq: "${teamId}"} 
                    user_id: {_in: ${userIds}}, 
                    _or: [
                        {start_date: {_gte: "${startDate}", _lte: "${endDate}"}},
                        {end_date: {_gte: "${startDate}", _lte: "${endDate}"}},
                    ]
                },
                order_by: {start_date: asc}
            ) {
                id
                user_id
                user_time_off_id
                project_id
                end_date
                start_date
                team_id
                total_duration
                created_by_id
                created_at
            }
        }`;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async insertUserResources(weeks: any, userIds: any, teamId: string) {
        let result = {};

        userIds.forEach(id => {
            result[id] = { data: [] };
            weeks.weeks.forEach(week => {
                result[id].data.push({
                    startDate: week.start,
                    endDate: week.end,
                    weekNumber: week.weekNumber,
                    plan: [],
                });
            });
        });

        const userIdsForQuery = userIds.map(id => `"${id}"`);

        for (let i = 0; i < weeks.weeksNormalized.length; i++) {
            let resourcesByWeek = null;
            try {
                resourcesByWeek = await this.getResourceByWeek(
                    weeks.weeksNormalized[i].start,
                    weeks.weeksNormalized[i].end,
                    userIdsForQuery,
                    teamId
                );

                resourcesByWeek.data.plan_resource.forEach(resource => {
                    const resourceWeekNumber = moment(resource.start_date, 'YYYY-MM-DDTHH:mm:ss').week();
                    result[resource.user_id].data.forEach(dataObj => {
                        dataObj.weekNumber === resourceWeekNumber ? dataObj.plan.push(resource) : null;
                    });
                });
            } catch (error) {
                return Promise.reject({
                    message: 'ERROR.PLAN_RESOURCE.SHORT_PLAN_RESOURCE_LIST_FAILED',
                });
            }
        }

        return result;
    }

    async getShortResourceList(userIds: any, startDate: string, endDate: string, userId: string) {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const weeks = this.splitPeriodToWeeks(startDate, endDate);

        return await this.insertUserResources(weeks, userIds, currentTeamData.data.user_team[0].team.id);
    }

    async getFullResourceList(userIds: any, startDate: string, endDate: string, userId: string) {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const weeks = this.splitPeriodToWeeks(startDate, endDate);
        
        return await this.insertUserResources(weeks, userIds, currentTeamData.data.user_team[0].team.id);
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
