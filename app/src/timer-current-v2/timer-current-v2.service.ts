import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TimerService } from '../timer/timer.service';
import { TimeService } from '../time/time.service';
import { TimerCurrentV2 } from './interfaces/timer-current-v2.interface';
import { Timer } from '../timer/interfaces/timer.interface';
import { Time } from '../time/interfaces/time.interface';

@Injectable()
export class TimerCurrentV2Service {
    _endTimerFlowSubject = new Subject<any>();

    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly timerService: TimerService,
        private readonly timeService: TimeService
    ) {}

    getTimersCurrentNotification6hrs(startDatetime: string): Promise<TimerCurrentV2[]> {
        const query = `{
            timer_current_v2(where: { start_datetime: { _lt: "${startDatetime}" }, notification_6hrs: { _eq: false } }, order_by: {created_at: asc}) {
                id
                start_datetime
                user {
                    id
                    email
                    username
                }
            }
        }
        `;

        let startedTimers: TimerCurrentV2[] = [];

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const data = res.data.timer_current_v2;
                    for (let index = 0; index < data.length; index++) {
                        const item = data[index];
                        const { id, start_datetime: startDatetime, user } = item;
                        const { id: userId, email: userEmail, username: userUsername } = user;

                        startedTimers.push({
                            id,
                            startDatetime,
                            user: {
                                id: userId,
                                email: userEmail,
                                username: userUsername,
                            },
                        });
                    }

                    return resolve(startedTimers);
                },
                _ => reject(startedTimers)
            );
        });
    }

    getTimersCurrentByStartDatetime(startDatetime: string): Promise<TimerCurrentV2[]> {
        const query = `{
            timer_current_v2(where: { start_datetime: { _lt: "${startDatetime}" } }, order_by: {created_at: asc}) {
                id
                start_datetime
                user {
                    id
                    email
                    username
                }
            }
        }
        `;

        let startedTimers: TimerCurrentV2[] = [];

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const data = res.data.timer_current_v2;
                    for (let index = 0; index < data.length; index++) {
                        const item = data[index];
                        const { id, start_datetime: startDatetime, user } = item;
                        const { id: userId, email: userEmail, username: userUsername } = user;

                        startedTimers.push({
                            id,
                            startDatetime,
                            user: {
                                id: userId,
                                email: userEmail,
                                username: userUsername,
                            },
                        });
                    }

                    return resolve(startedTimers);
                },
                _ => reject(startedTimers)
            );
        });
    }

    getTimerCurrent(userId: string): Promise<TimerCurrentV2 | null> {
        const query = `{
            timer_current_v2(where: { user_id: { _eq: "${userId}" } }, order_by: {created_at: desc}, limit: 1) {
                id
                issue
                start_datetime
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

        let startedTimer: TimerCurrentV2 = null;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const data = res.data.timer_current_v2.shift();
                    if (data) {
                        const time: Time = { timeISO: this.timeService.getISOTime() };
                        const { id, issue, start_datetime: startDatetime, project, user } = data;
                        const { id: projectId, name: projectName, project_color: projectColor } = project;
                        const { id: projectColorId, name: projectColorName } = projectColor;
                        const { id: userId, email: userEmail } = user;
                        startedTimer = {
                            id,
                            issue,
                            startDatetime,
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
                            time,
                        };
                    }

                    return resolve(startedTimer);
                },
                _ => reject(startedTimer)
            );
        });
    }

    addTimerCurrent(data: { userId: string; issue: string; projectId: string }): Promise<TimerCurrentV2 | null> {
        const { userId, issue, projectId } = data;

        const query = `mutation {
            insert_timer_current_v2(
                objects: [
                    {
                        issue: "${issue}",
                        user_id: "${userId}"
                        project_id: "${projectId}"
                        start_datetime: "${this.timeService.getISOTimeWithZeroMilliseconds()}",
                    }
                ]
            ){
                returning {
                    id
                }
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                _ => {
                    this.getTimerCurrent(userId)
                        .then((res: TimerCurrentV2) => resolve(res), _ => reject(null))
                        .catch(_ => reject(null));
                },
                _ => {
                    this.getTimerCurrent(userId)
                        .then((res: TimerCurrentV2) => resolve(res), _ => reject(null))
                        .catch(_ => reject(null));
                }
            );
        });
    }

    updateTimerCurrent(data: { userId: string; issue: string; projectId: string }): Promise<TimerCurrentV2 | null> {
        const { userId, issue, projectId } = data;

        const queryIssue = issue ? `issue: "${issue}"` : `issue: "Untitled issue"`;
        const queryProjectId = projectId ? `project_id: "${projectId}"` : '';

        const query = `mutation {
            update_timer_current_v2(
                where: {user_id: {_eq: "${userId}"}},
                _set: {
                    ${queryIssue}
                    ${queryProjectId}
                }
            ){
                returning {
                    id
                }
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                _ => {
                    this.getTimerCurrent(userId)
                        .then((res: TimerCurrentV2) => resolve(res), _ => reject(null))
                        .catch(_ => reject(null));
                },
                _ => {
                    this.getTimerCurrent(userId)
                        .then((res: TimerCurrentV2) => resolve(res), _ => reject(null))
                        .catch(_ => reject(null));
                }
            );
        });
    }

    updateTimerCurrentNotification6hrs(data: {
        userId: string;
        notification6hrs: boolean;
    }): Promise<AxiosResponse | null> {
        const { userId, notification6hrs } = data;

        const query = `mutation {
            update_timer_current_v2(
                where: {user_id: {_eq: "${userId}"}},
                _set: {
                    notification_6hrs: ${notification6hrs}
                }
            ){
                returning {
                    id
                }
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe((res: AxiosResponse) => resolve(res), _ => reject(null));
        });
    }

    deleteTimerCurrent(userId: string): Promise<Timer | null> {
        const query = `mutation {
            delete_timer_current_v2(
                where: { user_id: { _eq: "${userId}" } }
            ) {
                affected_rows
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.getTimerCurrent(userId)
                .then(
                    (res: TimerCurrentV2) => {
                        this.httpRequestsService.request(query).subscribe(
                            _ => {
                                if (res) {
                                    const { issue, startDatetime, user, project } = res;
                                    this.timerService
                                        .addTimer({
                                            issue,
                                            startDatetime,
                                            endDatetime: this.timeService.getISOTimeWithZeroMilliseconds(),
                                            userId: user.id,
                                            projectId: project.id,
                                            title: decodeURI(issue),
                                        })
                                        .then((res: Timer) => resolve(res), _ => reject(null))
                                        .catch(_ => reject(null));
                                } else {
                                    reject(null);
                                }
                            },
                            _ => reject(null)
                        );
                    },
                    _ => reject(null)
                )
                .catch(_ => reject(null));
        });
    }
}
