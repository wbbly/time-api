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
                        const returningRows = insertResourceRes.data.insert_plan_resource.returning[0];
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

    async getShortResourceList(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<AxiosResponse | AxiosError> {
        const resourceStatement = `
            _or: [
                {start_date: {_gte: "${startDate}", _lte: "${endDate}"}},
                {end_date: {_gte: "${startDate}", _lte: "${endDate}"}},
                {start_date: {_lt: "${startDate}"}, end_date: {_gt: "${endDate}"}}
            ],
            user_id: {_eq: "${userId}"}
        `;

        const query = `query{
            plan_resource(where: {${resourceStatement}}, order_by: {end_date: desc}) {
                start_date
                end_date
                total_duration
            }
        }`;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    getFullResourceList(userId: string, startDate: string, endDate: string): Promise<AxiosResponse | AxiosError> {
        const resourceStatement = `
            _or: [
                {start_date: {_gte: "${startDate}", _lte: "${endDate}"}},
                {end_date: {_gte: "${startDate}", _lte: "${endDate}"}},
                {start_date: {_lt: "${startDate}"}, end_date: {_gt: "${endDate}"}}
            ],
            user_id: {_eq: "${userId}"}
        `;

        const query = `query{
            plan_resource(where: {${resourceStatement}}, order_by: {end_date: desc}) {
                start_date
                end_date
                total_duration
                project_v2 {
                    name
                }
            }
        }`;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    divideResourcesByWeeks(resourceArr: any, startDate: string, endDate: string) {
        resourceArr = resourceArr.map(resource => {
            const firstWeekNumber = this.getWeekNumber(resource.start_date);
            const lastWeekNumber = this.getWeekNumber(resource.end_date);
            const totalWeeksQuantity = lastWeekNumber - firstWeekNumber + 1;
            const hoursPerWeek = resource.total_duration / totalWeeksQuantity;

            return {
                firstWeekNumber: firstWeekNumber,
                lastWeekNumber: lastWeekNumber,
                totalWeeksQuantity: totalWeeksQuantity,
                hoursPerWeek: hoursPerWeek * 3600000,
                startDate: resource.start_date,
                endDate: resource.end_date,
                totalDuration: resource.total_duration,
            };
        });
        let weeks = this.splitPeriodToWeeks(startDate, endDate);
        weeks = this.addWeekNumbers(weeks.weeksNormalized);

        return this.distributeByWeek(resourceArr, weeks);
    }

    divideResourcesByWeeksAndProject(resourceArr: any, startDate: string, endDate: string) {
        resourceArr = resourceArr.map(resource => {
            const firstWeekNumber = this.getWeekNumber(resource.start_date);
            const lastWeekNumber = this.getWeekNumber(resource.end_date);
            const totalWeeksQuantity = lastWeekNumber - firstWeekNumber + 1;
            const hoursPerWeek = resource.total_duration / totalWeeksQuantity;

            return {
                firstWeekNumber: firstWeekNumber,
                lastWeekNumber: lastWeekNumber,
                totalWeeksQuantity: totalWeeksQuantity,
                hoursPerWeek: hoursPerWeek * 3600000,
                startDate: resource.start_date,
                endDate: resource.end_date,
                totalDuration: resource.total_duration,
                projectName: resource.project_v2.name,
            };
        });

        let weeks = this.splitPeriodToWeeks(startDate, endDate);
        weeks = this.addWeekNumbers(weeks.weeksNormalized);

        return this.distributeByWeekAndProject(resourceArr, weeks);
    }

    distributeByWeekAndProject(resourceArr: any, weeks: any) {
        resourceArr.forEach(resource => {
            weeks.forEach(week => {
                if (week.weekNumber >= resource.firstWeekNumber && week.weekNumber <= resource.lastWeekNumber) {
                    if (!week.planResources) {
                        week.planResources = [];
                    }
                    week.planResources.push({
                        timeForPlanResource: resource.hoursPerWeek,
                        projectName: resource.projectName,
                    });
                }
            });
        });

        return weeks;
    }

    distributeByWeek(resourceArr: any, weeks: any) {
        resourceArr.forEach(resource => {
            weeks.forEach(week => {
                if (week.weekNumber >= resource.firstWeekNumber && week.weekNumber <= resource.lastWeekNumber) {
                    if (!week.hoursPerWeek) {
                        week.hoursPerWeek = 0;
                    }
                    week.hoursPerWeek = week.hoursPerWeek + resource.hoursPerWeek;
                }
            });
        });

        return weeks;
    }

    addWeekNumbers(weeks: any) {
        weeks.forEach(week => (week.weekNumber = this.getWeekNumber(week.start)));
        return weeks;
    }

    getWeekNumber(currentDate: string) {
        let date = new Date(currentDate);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
        const week1 = new Date(date.getFullYear(), 0, 4);

        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    }

    getWeekPeriodByDate(date: any) {
        // moment.locale('en', {
        //     week: {
        //         dow: 1, // Monday is the first day of the week.
        //         doy: 7, // Sunday is the last day of the week.
        //     },
        // });
        const startOfWeek = moment(date)
            .startOf('week')
            .startOf('day')
            .format('YYYY-MM-DDTHH:mm:ss');
        const endOfWeek = moment(date)
            .endOf('week')
            .endOf('day')
            .format('YYYY-MM-DDTHH:mm:ss');

        return {
            start: startOfWeek,
            end: endOfWeek,
        };
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
}
