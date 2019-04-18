import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { Timer } from './interfaces/timer.interface';
import { TimeService } from '../time/time.service';

@Injectable()
export class TimerService {
    constructor(private readonly httpRequestsService: HttpRequestsService, private readonly timeService: TimeService) {}

    getTimer(userId: string): Promise<Timer | null> {
        const query = `{
            timer_v2(where: { user_id: { _eq: "${userId}" } }, order_by: {created_at: desc}, limit: 1) {
                id
                issue
                start_datetime
                end_datetime
                project {
                    id
                    name
                    project_color {
                        id
                        name
                    }
                }
                user {
                    id
                    email
                }
            }
        }
        `;

        let timer: Timer = null;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const data = res.data.timer_v2.shift();
                    if (data) {
                        const {
                            id,
                            issue,
                            start_datetime: startDatetime,
                            end_datetime: endDatetime,
                            project,
                            user,
                        } = data;
                        const { id: projectId, name: projectName, project_color: projectColor } = project;
                        const { id: projectColorId, name: projectColorName } = projectColor;
                        const { id: userId, email: userEmail } = user;
                        timer = {
                            id,
                            issue,
                            startDatetime,
                            endDatetime,
                            project: {
                                id: projectId,
                                name: projectName,
                                projectColor: {
                                    id: projectColorId,
                                    name: projectColorName,
                                },
                            },
                            user: {
                                id: userId,
                                email: userEmail,
                            },
                        };
                    }

                    resolve(timer);
                },
                _ => reject(timer)
            );
        });
    }

    addTimer(data: {
        issue: string;
        startDatetime: string;
        endDatetime: string;
        userId: string;
        projectId: string;
    }): Promise<Timer | null> {
        const { issue, startDatetime, endDatetime, userId, projectId } = data;

        const query = `mutation {
            insert_timer_v2(
                objects: [
                    {
                        issue: "${issue}",
                        start_datetime: "${startDatetime}",
                        end_datetime: "${endDatetime}",
                        user_id: "${userId}"
                        project_id: "${projectId}"
                    }
                ]
            ){
                affected_rows
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                _ => {
                    this.getTimer(userId)
                        .then((res: Timer) => resolve(res), _ => reject(null))
                        .catch(_ => reject(null));
                },
                _ => {
                    this.getTimer(userId)
                        .then((res: Timer) => resolve(res), _ => reject(null))
                        .catch(_ => reject(null));
                }
            );
        });
    }

    getUserTimerList(userId: string) {
        const query = `{
            timer_v2(where: {user_id: {_eq: "${userId}"}}, order_by: {start_datetime: desc}, limit: 50) {
                id,
                start_datetime,
                end_datetime,
                issue,
                project {
                    name,
                    id,
                    project_color {
                        name
                    }
                }
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    getReportsTimerList(userEmails: string[], projectNames: string[], startDate: string, endDate: string) {
        const projectWhereStatement = projectNames.length
            ? `project: {name: {_in: [${projectNames.map(projectName => `"${projectName}"`).join(',')}]}}`
            : '';

        const timerStatementArray = [
            `user: {email: {_in: ["${userEmails.map(userEmail => `"${userEmail}"`).join(',')}"]}}`,
            `start_datetime: {_gte: "${this.timeService.getISOTimeByGivenValue(startDate).slice(0, -1)}"}`,
            `end_datetime: {_lt: "${this.timeService
                .getISOTimeByGivenValue(this.timeService.getTimestampByGivenValue(endDate) + 24 * 60 * 60 * 1000 - 1)
                .slice(0, -1)}"}`,
        ];

        if (projectWhereStatement) {
            timerStatementArray.push(projectWhereStatement);
        }

        const query = `{
            timer_v2(where: {${timerStatementArray.join(',')}}) {
                start_datetime
                end_datetime
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    updateTimerById(id: string, timer: Timer) {
        const { issue, projectId, startDatetime, endDatetime } = timer;
        const query = `mutation {
            update_timer_v2(
                where: {id: {_eq: "${id}"}},
                _set: {
                    issue: "${issue}",
                    project_id: "${projectId}",
                    start_datetime: "${startDatetime}",
                    end_datetime: "${endDatetime}"
                }
            ) {
                affected_rows
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    deleteTimerById(id: string) {
        const query = `mutation {
            delete_timer_v2(where: {id: {_eq: "${id}"}}) {
                affected_rows
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }
}
