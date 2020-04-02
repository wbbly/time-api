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

    async getTimerPlanningList(
        teamId: string,
        userIds: string[],
        timerOffIds: string[],
        startDate: string,
        endDate: string
    ): Promise<any> {
        return await this.getUsersTimerPlanningsByPeriod(startDate, endDate, userIds, teamId, timerOffIds);
    }

    async getTimerPlanningListByUserId(
        teamId: string,
        timerOffIds: string[],
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<any> {
        return await this.getUsersTimerPlanningsByPeriod(startDate, endDate, [userId], teamId, timerOffIds);
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

    private async getUsersTimerPlanningsByPeriod(
        startDate: string,
        endDate: string,
        userIds: string[],
        teamId: string,
        timerOffIds: string[]
    ): Promise<AxiosResponse | AxiosError> {
        let timerOffIdsExpression = ``;
        if (timerOffIds.length) {
            timerOffIdsExpression = `
                timer_off_id: {
                    _in: [${timerOffIds.map((id: string) => `"${id}"`).join(',')}]
                },
            `;
        }

        const query = `query {
            user (
                where: {
                    id: {
                        _in: [${userIds.map((id: string) => `"${id}"`).join(',')}]
                    }
                },
                order_by: {
                    username: asc
                }
            ) {
                id
                username
                email
                avatar
                timer_plannings (
                    order_by: {
                        start_date: asc
                    },
                    where: {
                        team_id: {_eq: "${teamId}"},
                        ${timerOffIdsExpression}
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
                            }
                        ]
                    }
                ) {
                    id
                    team_id
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
                logged: timer(
                    order_by: {
                        start_datetime: asc
                    }, 
                    where: {
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
                            }
                        ]
                    }
                ) {
                    project_id
                    issue
                    project {
                        name
                        project_color {
                        name
                        }
                    }
                    start_datetime
                    end_datetime
                }
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
