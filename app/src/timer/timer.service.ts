import { Injectable } from '@nestjs/common';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { Timer } from './interfaces/timer.interface';

@Injectable()
export class TimerService {
    constructor(private readonly httpRequestsService: HttpRequestsService) {}

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
                res => {
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
}
