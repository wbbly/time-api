import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';
import moment from 'moment';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { JiraAuthService } from '../core/jira-auth/jira-auth.service';
import { TimeService } from '../time/time.service';
import { UserService, JIRA_TYPES } from '../user/user.service';
import { JiraService } from '../core/sync/jira/jira.service';
import { ProjectService } from '../project/project.service';
import { TimerService } from '../timer/timer.service';
import { User } from '../user/interfaces/user.interface';

@Injectable()
export class SyncService {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly jiraAuthService: JiraAuthService,
        private readonly timeService: TimeService,
        private readonly userService: UserService,
        private readonly jiraService: JiraService,
        private readonly projectService: ProjectService,
        private readonly timerService: TimerService
    ) {}

    async checkJiraSync(urlJira: string, token: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .requestJiraGet(
                    `${urlJira.replace(/\/$/, '')}/rest/api/2/mypermissions?permissions=EDIT_OWN_WORKLOGS`,
                    token
                )
                .subscribe(
                    _ =>
                        resolve({
                            message: 'TIMER.JIRA_SYNC_SUCCESS',
                        }),
                    _ =>
                        reject({
                            message: 'ERROR.TIMER.JIRA_SYNC_FAILED',
                        })
                );
        });
    }

    private async getWorklogsByIssue(issue: any, params: any) {
        const { worklogs }: any = await this.jiraService.getWorklogsByIssue(params.urlJira, params.tokenJira, issue.id);
        let filterWorklogs = [];

        if (params.typeJira == JIRA_TYPES.SELF) {
            filterWorklogs = worklogs.filter(
                (el: any) =>
                    el.author.key == params.accountId && moment(el.started).format() >= params.dateFrom.format()
            );
        } else {
            filterWorklogs = worklogs.filter(
                (el: any) =>
                    el.author.accountId == params.accountId && moment(el.started).format() >= params.dateFrom.format()
            );
        }

        const { fields = {} } = issue;
        const { project = {}, timetracking } = fields;

        const { originalEstimateSeconds, originalEstimate } = timetracking;

        const { id: projectId, key: projectKey } = project;
        const { key: issueKey } = issue;
        if (filterWorklogs.length && projectId && projectKey && issueKey) {
            return {
                project: {
                    id: projectId,
                    key: projectKey,
                    issue: issueKey,
                },
                worklog: filterWorklogs,
                estimate: originalEstimateSeconds && originalEstimateSeconds > 0 ? originalEstimate : null,
            };
        }

        return null;
    }

    private async handleWorklogList(issues: any[], params: any) {
        const worklogList = [];
        for (const issue of issues) {
            const filterWorklog = await this.getWorklogsByIssue(issue, params);
            if (filterWorklog) {
                worklogList.push(filterWorklog);
            }
        }

        return worklogList;
    }

    async addWorklogWobblyFromJira(userId: string, date: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const worklogsList = await this.getWorklogList(userId, date);
                for (const item of worklogsList) {
                    const findProjects: any = await this.projectService.getProjectForSyncWithJira(
                        userId,
                        item.project.id
                    );

                    if (findProjects.data.project_v2.length > 0) {
                        const findProject = findProjects.data.project_v2.shift();
                        for (const work of item.worklog) {
                            let timezoneOffset: null | number = null;
                            const findTimer: any = await this.timerService.getTimer(userId, work.id);
                            const issueDecode = this.appendIssueTitleWithEstimate(
                                `${item.project.issue} ${work.comment}`,
                                item.estimate
                            );

                            let startDatetime = moment(work.started).format('YYYY-MM-DDTHH:mm:ssZ');
                            let endDatetime = moment(work.started)
                                .add(work.timeSpentSeconds, 'seconds')
                                .format('YYYY-MM-DDTHH:mm:ssZ');

                            const jiraUserTimezoneOffset = this.timeService.getTimezoneOffsetByGivenTimezoneName(
                                startDatetime,
                                work.author.timeZone
                            );
                            timezoneOffset = jiraUserTimezoneOffset;

                            let userTimezoneOffset = null;
                            const user: User | AxiosError = await this.userService.getUserById(userId);
                            if ('timezoneOffset' in user) {
                                userTimezoneOffset = user.timezoneOffset;
                            }

                            if (userTimezoneOffset && userTimezoneOffset !== jiraUserTimezoneOffset) {
                                startDatetime = moment(startDatetime)
                                    .add(-(jiraUserTimezoneOffset / (1000 * 60 * 60)), 'h')
                                    .add(userTimezoneOffset / (1000 * 60 * 60), 'h')
                                    .format('YYYY-MM-DDTHH:mm:ssZ');

                                endDatetime = moment(endDatetime)
                                    .add(-(jiraUserTimezoneOffset / (1000 * 60 * 60)), 'h')
                                    .add(userTimezoneOffset / (1000 * 60 * 60), 'h')
                                    .format('YYYY-MM-DDTHH:mm:ssZ');

                                timezoneOffset = userTimezoneOffset;
                            }

                            if (!findTimer) {
                                const timers = [];
                                const endOfDayTime = this.timeService.getEndOfDayByGivenTimezoneOffset(
                                    startDatetime,
                                    timezoneOffset
                                );

                                if (
                                    !moment(startDatetime)
                                        .add(-(timezoneOffset / (1000 * 60 * 60)), 'h')
                                        .isSame(
                                            moment(endDatetime).add(-(timezoneOffset / (1000 * 60 * 60)), 'h'),
                                            'day'
                                        ) &&
                                    !moment(endDatetime).isSame(
                                        moment(
                                            this.timeService.getStartOfDayByGivenTimezoneOffset(
                                                endDatetime,
                                                timezoneOffset
                                            )
                                        )
                                    )
                                ) {
                                    const firstDayTimer = {
                                        issue: issueDecode,
                                        startDatetime,
                                        endDatetime: endOfDayTime,
                                        userId,
                                        projectId: findProject.id,
                                        jiraWorklogId: work.id,
                                        syncJiraStatus: true,
                                        title: decodeURI(issueDecode),
                                        timezoneOffset,
                                    };
                                    const secondDayTimer = {
                                        issue: issueDecode,
                                        startDatetime: this.timeService.getStartOfDayByGivenTimezoneOffset(
                                            endDatetime,
                                            timezoneOffset
                                        ),
                                        endDatetime,
                                        userId,
                                        projectId: findProject.id,
                                        jiraWorklogId: work.id,
                                        syncJiraStatus: true,
                                        title: decodeURI(issueDecode),
                                        timezoneOffset,
                                    };
                                    timers.push(firstDayTimer, secondDayTimer);
                                } else {
                                    const newTimer = {
                                        issue: issueDecode,
                                        startDatetime,
                                        endDatetime,
                                        userId,
                                        projectId: findProject.id,
                                        jiraWorklogId: work.id,
                                        syncJiraStatus: true,
                                        title: decodeURI(issueDecode),
                                        timezoneOffset,
                                    };
                                    timers.push(newTimer);
                                }

                                for (const timer of timers) {
                                    await this.timerService.addTimer(timer);
                                }
                            } else {
                                const updateTimer = {
                                    issue: issueDecode,
                                    startDatetime,
                                    endDatetime,
                                    projectId: findProject.id,
                                    timezoneOffset,
                                };

                                await this.timerService.updateTimerById(userId, findTimer.id, updateTimer);
                            }
                        }
                    }
                }

                return resolve({
                    message: 'TIMER.JIRA_SYNC_SUCCESS',
                });
            } catch (e) {
                return reject({
                    message: 'ERROR.TIMER.JIRA_SYNC_FAILED',
                });
            }
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

            const tokenJiraDecrypted = this.jiraAuthService.decrypt(user.tokenJira);
            if (tokenJiraDecrypted && tokenJiraDecrypted === user.tokenJira) {
                // Forcely encrypt user.tokenJira value in DB
                await this.updateUserTokenJira(userId, tokenJiraDecrypted);
            }

            this.httpRequestsService
                .requestJiraPost(
                    `${user.urlJira}/rest/api/2/issue/${jiraIssueNumber}/worklog`,
                    query,
                    tokenJiraDecrypted
                )
                .subscribe(
                    async (res: any) => {
                        let issue = `${jiraIssueNumber} ${jiraIssueComment}`;
                        try {
                            const estimate = await this.getEstimate(user.urlJira, tokenJiraDecrypted, res.issueId);
                            issue = this.appendIssueTitleWithEstimate(issue, estimate);
                        } catch (e) {
                            console.log(e);
                        }

                        try {
                            return resolve(await this.updateTimerDataAfterJiraSync(userId, taskId, issue, res.id));
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

    private getEstimate(urlJira: string, token: string, issueId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .requestJiraGet(`${urlJira.replace(/\/$/, '')}/rest/api/2/issue/${issueId}`, token)
                .subscribe((res: any) => resolve(res.fields.timetracking.originalEstimate), err => reject(err));
        });
    }

    private appendIssueTitleWithEstimate(issueTitle: string, estimate: string) {
        return encodeURI(`${estimate ? estimate + ' | ' : ''}${issueTitle}`);
    }

    private updateTimerDataAfterJiraSync(
        userId: string,
        timerId: string,
        issue: string,
        jiraWorklogId: string
    ): Promise<any> {
        const query = `mutation {
            update_timer_v2(
                where: { user_id: { _eq: "${userId}" }, id: {_eq: "${timerId}"} },
                _set: {
                    issue: "${issue}",
                    sync_jira_status: true
                    jira_worklog_id: ${jiraWorklogId}
                }
            ) {
                returning {
                    id
                    issue
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

    private updateUserTokenJira(userId: string, tokenJira: string): Promise<any> {
        const tokenJiraEncrypted = this.jiraAuthService.encrypt(tokenJira);

        const query = `mutation {
            update_user(
                where: {
                    id: {_eq: "${userId}"}
                },
                _set: {
                    token_jira: ${tokenJiraEncrypted ? '"' + tokenJiraEncrypted + '"' : null}
                }
            ) {
                returning {
                    id
                }
            }
        }
        `;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    private async getWorklogList(userId: string, date: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const user: any = await this.userService.getUserById(userId);
                const { urlJira, tokenJira, typeJira } = user;
                if (!urlJira || !tokenJira) {
                    return reject({
                        message: 'ERROR.SYNC.JIRA_FAILED',
                    });
                }

                const nowDate = moment().endOf('day');
                const dateFrom = moment(date).startOf('day');

                if (dateFrom > nowDate) {
                    return reject({
                        message: 'ERROR.SYNC.JIRA_FAILED',
                    });
                }

                const diffDay = nowDate.diff(dateFrom, 'days');

                const perPageLimit = 100;
                const params = {
                    startAt: 0,
                    maxResults: perPageLimit,
                    fields: '%22key,timetracking,project,%22',
                    jql: `worklogDate >= -${diffDay}d AND worklogAuthor = currentuser()`,
                };

                const userProfile: any = await this.jiraService.getCurrentUser(urlJira, tokenJira);
                const worklogList = [];

                const { total }: any = await this.jiraService.getIssues(urlJira, tokenJira, params);
                const countPage = Math.ceil(total / perPageLimit);
                for (let i = 0; i < countPage; i++) {
                    params.startAt = i * perPageLimit;
                    const { issues }: any = await this.jiraService.getIssues(urlJira, tokenJira, params);
                    const handleWorklogList = await this.handleWorklogList(issues, {
                        urlJira,
                        tokenJira,
                        typeJira,
                        accountId: userProfile.key || userProfile.accountId,
                        dateFrom,
                    });

                    if (handleWorklogList.length > 0) {
                        worklogList.push(...handleWorklogList);
                    }
                }

                return resolve(worklogList);
            } catch (e) {
                return reject({
                    message: 'ERROR.TIMER.JIRA_SYNC_FAILED',
                });
            }
        });
    }
}
