import { Injectable } from '@nestjs/common';

import { AxiosResponse, AxiosError } from 'axios';
import moment from 'moment';

import { TimerPlanning } from './interfaces/timer-planning.interface';
import { HttpRequestsService } from '../core/http-requests/http-requests.service';

@Injectable()
export class TimerPlanningService {
    constructor(private readonly httpRequestsService: HttpRequestsService) {}

    async createTimerPlanning(data: {
        teamId: string;
        userId: string;
        projectId: string;
        timerOffId: string;
        duration: string;
        startDate: string;
        endDate: string;
        createdById: string;
    }): Promise<AxiosResponse | AxiosError> {
        const { teamId, userId, projectId, timerOffId, duration, startDate, endDate, createdById } = data;

        const query = `mutation {
            insert_timer_planning (
                objects: [
                    {
                        team_id: "${teamId}",
                        user_id: "${userId}",
                        project_id: ${projectId ? '"' + projectId + '"' : null},
                        timer_off_id: ${timerOffId ? '"' + timerOffId + '"' : null},
                        duration: "${duration}",
                        start_date: "${startDate}",
                        end_date: "${endDate}",
                        created_by_id: "${createdById}"
                    }
                ]
            ) {
                returning {
                    id
                    team_id
                    user_id
                    project_id
                    timer_off_id
                    duration
                    start_date
                    end_date
                    created_by_id
                    created_at
                }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getTimerPlanningById(id: string): Promise<TimerPlanning | AxiosError> {
        return new Promise((resolve, reject) => {
            const query = `{
                timer_planning (
                    where: {
                        id: {
                            _eq: "${id}"
                        }
                    },
                ) {
                    id
                    team_id
                    user_id
                    project_id
                    timer_off_id
                    duration
                    start_date
                    end_date
                    created_by_id
                    created_at
                }
            }
            `;

            this.httpRequestsService
                .request(query)
                .subscribe(
                    (res: AxiosResponse) => resolve(res.data.timer_planning.shift()),
                    (error: AxiosError) => reject(error)
                );
        });
    }

    async updateTimerPlanning(
        id: string,
        data: {
            userId: string;
            projectId: string;
            timerOffId: string;
            duration: number;
            startDate: string;
            endDate: string;
        }
    ): Promise<AxiosResponse | AxiosError> {
        const { userId, projectId, timerOffId, duration, startDate, endDate } = data;

        const query = `mutation {
            update_timer_planning (
                where: {
                    id: {
                        _eq: "${id}"
                    }
                },
                _set: {
                    user_id: "${userId}",
                    project_id: ${projectId ? '"' + projectId + '"' : null},
                    timer_off_id: ${timerOffId ? '"' + timerOffId + '"' : null},
                    duration: "${duration}",
                    start_date: "${startDate}",
                    end_date: "${endDate}"
                }
            ) {
                returning {
                    id
                    team_id
                    user_id
                    project_id
                    timer_off_id
                    duration
                    start_date
                    end_date
                    created_by_id
                    created_at
                }
            }
        }`;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async deleteTimerPlanningById(id: string): Promise<AxiosResponse | AxiosError> {
        const query = `mutation {
            delete_timer_planning (
                where: {
                    id: {
                        _eq: "${id}"
                    }
                }
            ) {
                affected_rows
            }
        }`;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getTimerPlanningList(teamId: string, userIds: string[], startDate: string, endDate: string): Promise<any> {
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
                const res = (await this.getUsersTimerPlanningsByWeekPeriod(
                    weekNormalized.start,
                    weekNormalized.end,
                    userIds,
                    teamId
                )) as AxiosResponse;

                const planTimerPlanningList = res.data.timer_planning;
                planTimerPlanningList.forEach((userTimerPlanning: any) => {
                    const { start_date: startDate, user_id: userId } = userTimerPlanning;
                    const weekNumber = moment(startDate, 'YYYY-MM-DDTHH:mm:ss').week();

                    resourceListUsersData[userId].data.forEach((dataObj: any) => {
                        dataObj.weekNumber === weekNumber ? dataObj.plan.push(userTimerPlanning) : null;
                    });
                });
            } catch (error) {
                console.log(error);
            }
        }

        return Promise.resolve(resourceListUsersData);
    }

    async getTimerPlanningListByUserId(
        teamId: string,
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<any> {
        const weekPeriods = this.splitDateRangeToWeekPeriods(startDate, endDate);
        const { weeks, weeksNormalized } = weekPeriods;

        const resourceListUserData = [];
        weeks.forEach((week: any) => {
            resourceListUserData.push({
                startDate: week.start,
                endDate: week.end,
                weekNumber: week.weekNumber,
                plan: [],
                logged: [],
            });
        });

        const resourceListUsersData = {};
        [userId].forEach((id: string) => (resourceListUsersData[id] = { data: resourceListUserData }));

        for (const weekNormalized of weeksNormalized) {
            try {
                const res = (await this.getUsersTimerPlanningsByWeekPeriod(
                    weekNormalized.start,
                    weekNormalized.end,
                    [userId],
                    teamId
                )) as AxiosResponse;

                const planTimerPlanningList = res.data.timer_planning;
                planTimerPlanningList.forEach((userTimerPlanning: any) => {
                    const { start_date: startDate, user_id: userId } = userTimerPlanning;
                    const weekNumber = moment(startDate, 'YYYY-MM-DDTHH:mm:ss').week();

                    resourceListUsersData[userId].data.forEach((dataObj: any) => {
                        dataObj.weekNumber === weekNumber ? dataObj.plan.push(userTimerPlanning) : null;
                    });
                });
            } catch (error) {
                console.log(error);
            }
        }

        return Promise.resolve(resourceListUsersData);
    }

    private async getUserLoggedEntriesByWeekPeriod(
        startDate: string,
        endDate: string,
        userId: string,
        teamId: string
    ): Promise<AxiosResponse | AxiosError> {
        const query = `{
            timer_v2 (
                where: {
                    project: {
                        team_id: {
                            _eq: "${teamId}"
                        }
                    },
                    user_id: {
                        _eq: "${userId}"
                    }, 
                    _and: [
                        {
                            start_datetime: {
                                _gte: "${startDate}",
                                _lte: "${endDate}"
                            }
                        },
                        {
                            end_datetime: {
                                _gte: "${startDate}",
                                _lte: "${endDate}"
                            }
                        },
                    ]
                },
                order_by: {
                    start_datetime: desc
                }
            ) {
                id
                start_datetime
                end_datetime
                project {
                    name
                    project_color {
                        name
                    }
                }
            }
        }`;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    private async getUsersTimerPlanningsByWeekPeriod(
        startDate: string,
        endDate: string,
        userIds: string[],
        teamId: string
    ): Promise<AxiosResponse | AxiosError> {
        const query = `query {
            timer_planning (
                where: {
                    team_id: {
                        _eq: "${teamId}"
                    },
                    user_id: {
                        _in: [${userIds.map((id: string) => `"${id}"`).join(',')}]
                    },
                    _and: [
                        {
                            start_date: {
                                _gte: "${startDate}",
                                _lte: "${endDate}"
                            }
                        },
                        {
                            end_date: {
                                _gte: "${startDate}",
                                _lte: "${endDate}"
                            }
                        },
                    ]
                },
                order_by: {
                    start_date: asc
                }
            ) {
                id
                team_id
                user_id
                user {
                    username
                    email
                }
                project_id
                project {
                    name
                    project_color {
                        name
                    }
                }
                timer_off_id
                timer_off {
                    title
                }
                duration
                start_date
                end_date
                created_by_id
                created_by {
                    username
                    email
                }
                created_at
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
