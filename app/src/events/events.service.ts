import { Injectable, HttpService } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { StartedTimer } from './interfaces/started-timer.interface';
import { StoppedTimer } from './interfaces/stopped-timer.interface';

@Injectable()
export class EventsService {
    private url = 'https://la-ge.herokuapp.com/v1alpha1/graphql';
    private accessKey = 'lalala';

    constructor(private readonly httpService: HttpService) {}

    getTimer(userEmail: string): Observable<StartedTimer | null> {
        const query = `{
            timer_current(where: { user_email: { _eq: "${userEmail}" } }, order_by: { id: desc }) {
                user_email
                issue
                date_from
                project {
                    id
                    name
                    colorProject
                }
            }
        }
        `;

        let startedTimer: StartedTimer = null;

        return new Observable(observer => {
            this.request(query).subscribe(
                res => {
                    const data = res.data.timer_current.shift();
                    if (data) {
                        const { user_email, issue, date_from, project } = data;
                        const { id, name, colorProject } = project;
                        startedTimer = {
                            userEmail: user_email,
                            issue: issue,
                            dateFrom: date_from,
                            project: {
                                id,
                                name,
                                colorProject,
                            },
                        };
                    }

                    observer.next(startedTimer);
                },
                _ => observer.error(startedTimer)
            );
        });
    }

    addTimer(data: { userEmail: string; issue: string; projectId: number }): Observable<StartedTimer | null> {
        const { userEmail, issue, projectId } = data;

        const query = `mutation {
            insert_timer_current(
                objects: [
                    {
                        user_email: "${userEmail}"
                        issue: "${issue}",
                        date_from: "${new Date().toUTCString()}",
                        project_id: "${projectId}"
                    }
                ]
            ){
                affected_rows
            }
        }
        `;

        return new Observable(observer => {
            this.request(query).subscribe(
                _ => {
                    this.getTimer(userEmail).subscribe(
                        (res: StartedTimer) => observer.next(res),
                        _ => observer.error(null)
                    );
                },
                _ => {
                    this.getTimer(userEmail).subscribe(
                        (res: StartedTimer) => observer.next(res),
                        _ => observer.error(null)
                    );
                }
            );
        });
    }

    deleteTimer(userEmail: string): Observable<StoppedTimer | null> {
        const query = `mutation {
            delete_timer_current (
                where: { user_email: { _eq: "${userEmail}" } }
            ) {
                affected_rows
            }
        }
        `;

        let stopedTimer: StoppedTimer = null;

        return new Observable(observer => {
            this.getTimer(userEmail).subscribe(
                (res: StartedTimer) => {
                    stopedTimer = {
                        ...res,
                        ...{
                            dateTo: new Date().toUTCString(),
                        },
                    };

                    this.request(query).subscribe(_ => observer.next(stopedTimer), _ => observer.error(stopedTimer));
                },
                _ => observer.error(stopedTimer)
            );
        });
    }

    private request(query: any): Observable<any> {
        return this.httpService
            .post(
                this.url,
                { query },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Hasura-Access-Key': this.accessKey,
                    },
                }
            )
            .pipe(map(response => response.data));
    }
}
