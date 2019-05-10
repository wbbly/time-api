import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TimerService } from '../timer/timer.service';
import { TimeService } from '../time/time.service';
import { TeamService } from '../team/team.service';
import { Project } from './interfaces/project.interface';

@Injectable()
export class ProjectService {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly timerService: TimerService,
        private readonly timeService: TimeService,
        private readonly teamService: TeamService
    ) {}

    async getProjectList(userId) {
        let currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        let currentTeamId = currentTeamData.data.user_team[0].team.id;
        const query = `{
            project_v2(
                    order_by: {name: desc}
                    where: {
                        team_id: { _eq: "${currentTeamId}" }
                    }
                ) 
                {
                    id
                    name
                    is_active
                    project_color {
                        name
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

    getAdminProjectList() {
        const query = `{
            project_v2(order_by: {name: asc}, limit: 100) {
                id
                is_active
                name
                timer {
                    start_datetime
                    end_datetime
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

    getUserProjectList(userId: string) {
        const query = `{
            project_v2(order_by: {name: asc})  {
                id
                is_active
                name
                timer(where: {user_id: {_eq: "${userId}"}}) {
                    start_datetime
                    end_datetime
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

    getReportsProject(projectName: string, userEmails: string[], startDate: string, endDate: string) {
        const timerStatementArray = [
            `_or: [
            {start_datetime: {_gte: "${startDate}", _lt: "${endDate}"}},
            {end_datetime: {_gte: "${startDate}", _lt: "${endDate}"}},
            {start_datetime: {_lt: "${startDate}"}, end_datetime: {_gt: "${endDate}"}}
        ]`,
        ];

        const userWhereStatement = userEmails.length
            ? `user: {email: {_in: [${userEmails.map(userEmail => `"${userEmail}"`).join(',')}]}}`
            : '';
        if (userWhereStatement) {
            timerStatementArray.push(userWhereStatement);
        }

        const timerStatementString = timerStatementArray.join(', ');
        const timerWhereStatement = timerStatementString
            ? `(where: {${timerStatementString}}, order_by: {end_datetime: desc})`
            : '(order_by: {end_datetime: desc})';

        const query = `{
            project_v2(where: {name: {_eq: "${projectName}"}}) {
                timer ${timerWhereStatement} {
                    issue
                    project {
                        name
                    }
                    user {
                        email
                        username
                    }
                    start_datetime
                    end_datetime
                }
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    this.prepareReportsProjectData(res.data.project_v2, startDate, endDate);

                    resolve(res);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    getReportsProjects(projectNames: string[], userEmails: string[], startDate: string, endDate: string) {
        const projectWhereStatement = projectNames.length
            ? `(where: {name: {_in: [${projectNames
                  .map(projectName => `"${projectName}"`)
                  .join(',')}]}}, order_by: {name: asc})`
            : '(order_by: {name: asc})';

        const userWhereStatement = userEmails.length
            ? `user: {email: {_in: [${userEmails.map(userEmail => `"${userEmail}"`).join(',')}]}}`
            : '';
        let dateStatement = '';

        if (startDate) {
            endDate = endDate ? endDate : startDate;

            dateStatement = `_or: [
                {start_datetime: {_gte: "${startDate}", _lte: "${endDate}"}},
                {end_datetime: {_gte: "${startDate}", _lte: "${endDate}"}},
                {start_datetime: {_lt: "${startDate}"}, end_datetime: {_gt: "${endDate}"}}
            ]`;
        }

        let timerStatementArray = [];
        if (userWhereStatement) {
            timerStatementArray.push(userWhereStatement);
        }
        if (dateStatement) {
            timerStatementArray.push(dateStatement);
        }
        const timerStatementString = timerStatementArray.join(', ');
        const timerWhereStatement = timerStatementString ? `(where: {${timerStatementString}})` : '';

        const query = `{
            project_v2 ${projectWhereStatement} {
                id
                name
                timer ${timerWhereStatement} {
                    start_datetime
                    end_datetime         
                }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    for (let i = 0; i < res.data.project_v2.length; i++) {
                        const project = res.data.project_v2[i];
                        this.timerService.limitTimeEntriesByStartEndDates(project.timer, startDate, endDate);
                    }

                    resolve(res);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async addProject(project: Project, userId: string) {
        const { name, projectColorId } = project;

        let currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        let currentTeamId = currentTeamData.data.user_team[0].team.id;
        const query = `mutation {
            insert_project_v2(
                objects: [
                    {
                        name: "${name.toLowerCase().trim()}",
                        project_color_id: "${projectColorId}",
                        team_id: "${currentTeamId}"
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
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    getProjectById(id: string) {
        const query = `{
            project_v2 (where: {id: {_eq: "${id}"}}) {
                id
                name
                project_color{ 
                    id
                    name
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

    updateProjectById(id: string, project: Project) {
        const { name, projectColorId } = project;

        const query = `mutation {
            update_project_v2(
                where: {id: {_eq: "${id}"}},
                _set: {
                    name: "${name.toLowerCase().trim()}",
                    project_color_id: "${projectColorId}"
                }
            ) {
                returning {
                    id
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

    deleteProjectById(id: string) {
        const query = `mutation {
            delete_project_v2(where: {id: {_eq: "${id}"}}) {
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

    private prepareReportsProjectData(data: any, startDate: string, endDate: string): void {
        for (let i = 0; i < data.length; i++) {
            const projectV2 = data[i];
            this.timerService.limitTimeEntriesByStartEndDates(projectV2.timer, startDate, endDate);

            const projectV2Report = {};
            for (let j = 0; j < projectV2.timer.length; j++) {
                const timeEntry = projectV2.timer[j];
                const { issue, start_datetime: startDatetime, end_datetime: endDatetime, project, user } = timeEntry;
                const { name: projectName } = project;
                const { email: userEmail, username } = user;

                const uniqueTimeEntryKey = `${issue}-${projectName}-${userEmail}`;
                const previousDuration = projectV2Report[uniqueTimeEntryKey]
                    ? projectV2Report[uniqueTimeEntryKey].durationTimestamp
                    : 0;
                const currentDuration =
                    this.timeService.getTimestampByGivenValue(endDatetime) -
                    this.timeService.getTimestampByGivenValue(startDatetime);
                projectV2Report[uniqueTimeEntryKey] = {
                    user: {
                        username,
                    },
                    issue,
                    durationTimestamp: previousDuration + currentDuration,
                    startDatetime,
                    endDatetime: projectV2Report[uniqueTimeEntryKey]
                        ? projectV2Report[uniqueTimeEntryKey].endDatetime
                        : endDatetime,
                };
            }

            const projectV2ReportValues = Object.values(projectV2Report);
            projectV2ReportValues.sort((a, b) => a['startDatetime'] - b['endDatetime']);
            for (let i = 0, projectV2ReportLength = projectV2ReportValues.length; i < projectV2ReportLength; i++) {
                let timeEntry = projectV2ReportValues[i];
                timeEntry['duration'] = this.timeService.getTimeDurationByGivenTimestamp(
                    timeEntry['durationTimestamp']
                );
            }

            data[i].timer = projectV2ReportValues.reverse();
        }
    }
}
