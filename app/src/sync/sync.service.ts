import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TimeService } from '../time/time.service';

@Injectable()
export class SyncService {
    constructor(private readonly httpRequestsService: HttpRequestsService, private readonly timeService: TimeService) {}

    async checkJiraSync(urlJira: string, token: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .requestJiraGet(`${urlJira.replace(/\/$/, '')}/rest/api/2/mypermissions`, token)
                .subscribe(
                    _ =>
                        resolve({
                            message: 'ERROR.TIMER.JIRA_SYNC_SUCCESS',
                        }),
                    _ =>
                        reject({
                            message: 'ERROR.TIMER.JIRA_SYNC_FAILED',
                        })
                );
        });
    }

    async addJiraWorklog(userId: string, taskId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            let timer: any = null;
            try {
                timer = await this.getTimerDataBeforeJiraSync(userId, taskId);
            } catch (e) {
                console.log(e);
            }

            if (!timer) {
                return reject({
                    message: 'ERROR.TIMER.JIRA_ADD_WORKLOG_FAILED',
                });
            }

            const { issue, startDatetime, endDatetime, syncJiraStatus, user } = timer;

            if (syncJiraStatus) {
                return reject({
                    message: 'ERROR.TIMER.JIRA_WORKLOG_ALREADY_ADDED',
                });
            }

            //
            // The rules of add the worklog to Jira:
            // 1) Main rule: the issue must be looks like "ISSUE_NUMBER ISSUE_COMMENT", e.g. WOB-1 Issue title
            // 2) ISSUE_COMMENT not required
            //
            const timerIssueSplitted = issue ? decodeURI(issue).split(' ') : [];
            const jiraIssueNumber = timerIssueSplitted.shift().trim();
            const jiraIssueComment = timerIssueSplitted.join(' ');

            const timeSpentSeconds =
                Math.round(
                    (this.timeService.getTimestampByGivenValue(endDatetime) -
                        this.timeService.getTimestampByGivenValue(startDatetime)) /
                        60000
                ) * 60;

            if (timeSpentSeconds < 60) {
                return reject({
                    message: 'ERROR.TIMER.JIRA_WORKLOG_1_MIN_THRESHHOLD',
                });
            }

            const query = {
                comment: jiraIssueComment,
                started: this.timeService.getISOTimeByGivenValue(startDatetime).replace('Z', '+0000'),
                timeSpentSeconds,
            };

            this.httpRequestsService
                .requestJiraPost(`${user.urlJira}/rest/api/2/issue/${jiraIssueNumber}/worklog`, query, user.tokenJira)
                .subscribe(
                    async _ => {
                        try {
                            const res = await this.updateTimerDataAfterJiraSync(userId, taskId);

                            return resolve(res);
                        } catch (e) {
                            console.log(e);
                        }

                        return reject({
                            message: 'ERROR.TIMER.JIRA_ADD_WORKLOG_FAILED',
                        });
                    },
                    _ =>
                        reject({
                            message: 'ERROR.TIMER.JIRA_ADD_WORKLOG_FAILED',
                        })
                );
        });
    }

    private getTimerDataBeforeJiraSync(userId: string, timerId: string): Promise<any> {
        const query = `{
            timer_v2(where: { user_id: { _eq: "${userId}" }, id: {_eq: "${timerId}"} }) {
                issue
                start_datetime
                end_datetime
                sync_jira_status
                user {
                    token_jira
                    url_jira
                }
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const timer = res.data.timer_v2[0];

                    if (!timer) {
                        return reject();
                    }

                    const {
                        issue,
                        start_datetime: startDatetime,
                        end_datetime: endDatetime,
                        sync_jira_status: syncJiraStatus,
                        user,
                    } = timer;
                    const { token_jira: tokenJira, url_jira: urlJira } = user;

                    return resolve({
                        issue,
                        startDatetime,
                        endDatetime,
                        syncJiraStatus,
                        user: {
                            tokenJira,
                            urlJira,
                        },
                    });
                },
                _ => reject()
            );
        });
    }

    private updateTimerDataAfterJiraSync(userId: string, timerId: string): Promise<any> {
        const query = `mutation {
            update_timer_v2(
                where: { user_id: { _eq: "${userId}" }, id: {_eq: "${timerId}"} },
                _set: {
                    sync_jira_status: true
                }
            ) {
                returning {
                    id
                }
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const timer = res.data.update_timer_v2.returning[0];

                    if (!timer) {
                        return reject();
                    }

                    return resolve(res);
                },
                _ => reject()
            );
        });
    }
}
