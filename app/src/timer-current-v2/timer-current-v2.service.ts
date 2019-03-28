import { Injectable } from '@nestjs/common';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TimerService } from '../timer/timer.service';
import { TimerCurrentV2 } from './interfaces/timer-current-v2.interface';
import { Timer } from '../timer/interfaces/timer.interface';

@Injectable()
export class TimerCurrentV2Service {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly timerService: TimerService
    ) {}

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
                res => {
                    const data = res.data.timer_current_v2.shift();
                    if (data) {
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
                        };
                    }

                    resolve(startedTimer);
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
                        start_datetime: "${new Date().toISOString()}",
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

        const query = `mutation {
            update_timer_current_v2(
                where: {user_id: {_eq: "${userId}"}},
                _set: {
                    issue: "${issue}",
                    project_id: "${projectId}"
                }
            ){
                affected_rows
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

    deleteTimerCurrent(userId: string): Promise<Timer | null> {
        const query = `mutation {
            delete_timer_current_v2 (
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
                                const { issue, startDatetime, user, project } = res;
                                this.timerService
                                    .addTimer({
                                        issue,
                                        startDatetime,
                                        endDatetime: new Date().toISOString(),
                                        userId: user.id,
                                        projectId: project.id,
                                    })
                                    .then((res: Timer) => resolve(res), _ => reject(null))
                                    .catch(_ => reject(null));
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
