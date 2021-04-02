import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';
import slugify from 'slugify';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TimerService } from '../timer/timer.service';
import { TimeService } from '../time/time.service';
import { TeamService } from '../team/team.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { Project } from './interfaces/project.interface';
import { JiraService } from '../core/sync/jira/jira.service';
import { UserService } from '../user/user.service';

export enum PROJECT_TYPES_TO_SYNC {
    JIRA = 'jira',
}

@Injectable()
export class ProjectService {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly timerService: TimerService,
        private readonly timeService: TimeService,
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly jiraService: JiraService,
        private readonly userService: UserService
    ) {}

    async getProjectList(userId: string, withTimerList: boolean, withJiraID: boolean = false) {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        const isOwner =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_OWNER;

        let clientQueryParam = '';
        let timerWhereStatement = `(where: {user_id: {_eq: "${userId}"}})`;

        if (isOwner || isAdmin) {
            clientQueryParam = `client { id, name, company_name }`;
            timerWhereStatement = '';
        }

        const query = `{
            project_v2(
                order_by: {name: asc}
                where: {
                    team_id: { _eq: "${currentTeamId}" }
                }
            ) {
                id
                name
                is_active
                project_color {
                    name
                }
                ${withJiraID ? `jira_project_id` : ''}
                ${clientQueryParam}
                ${
                    withTimerList
                        ? `timer ${timerWhereStatement} {
                            start_datetime
                            end_datetime
                        }`
                        : ``
                }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getProjectForSyncWithJira(userId: string, jiraProjectId: string) {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const query = `{
            project_v2(
                order_by: {name: asc}
                where: {
                    team_id: { _eq: "${currentTeamId}" }
                    jira_project_id: { _eq: "${jiraProjectId}" }
                }
            ) {
                id
                name
                is_active
                project_color {
                    name
                }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    getReportsProject(
        teamId: string,
        projectName: string,
        userEmails: string[],
        startDate: string,
        endDate: string,
        taskName?: string,
    ) {
        const projectWhereStatement: any = {
                team_id: {
                    _eq: teamId,
                },
                name: {
                    _eq: projectName,
                },
        };

        const timerWhereStatement: any = {
            _or: [
                {
                    start_datetime: {
                        _gte: startDate,
                        _lt: endDate,
                    },
                },
                {
                    end_datetime: {
                        _gte: startDate,
                        _lt: endDate,
                    },
                },
                {
                    start_datetime: {
                        _lt: startDate,
                    },
                    end_datetime: {
                        _gt: endDate,
                    },
                },
            ],
            user: userEmails.length ?
                {email: { _in : userEmails }}
                : null,
            title: taskName ?
                {_ilike : taskName.toLowerCase().trim().replace(/%/g, '\\%')}
                : null,
        };

        const variables = {
            projectWhere: projectWhereStatement,
            timerWhere: timerWhereStatement,
        };

        const query = `query project_v2($projectWhere:project_v2_bool_exp, $timerWhere:timer_v2_bool_exp) {
            project_v2:project_v2(where:$projectWhere){
                timer:timer(where:$timerWhere, order_by:{end_datetime: desc}) {
                    issue
                    project {
                        name
                    }
                    user {
                        id
                        email
                        username
                    }
                    start_datetime
                    end_datetime
                }
                id
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
                (res: AxiosResponse) => {
                    this.prepareReportsProjectData(res.data.project_v2, startDate, endDate);
                    return resolve(res);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    getReportsProjects(
        teamId: string,
        projectNames: string[],
        userEmails: string[],
        startDate: string,
        endDate: string
    ) {
        const projectWhereStatement: any = {
            team_id: {
                _eq: teamId,
            },
            name: projectNames.length
                ? {_in: projectNames}
                : null,
        };

        let timerWhereStatement: any = null;
        if (startDate) {
            endDate = endDate ? endDate : startDate;
            timerWhereStatement = {
                _or: [
                    {
                        start_datetime: {
                            _gte: startDate,
                            _lte: endDate,
                        },
                    },
                    {
                        end_datetime: {
                            _gte: startDate,
                            _lte: endDate,
                        },
                    },
                    {
                        start_datetime: {
                            _lt: startDate,
                        },
                        end_datetime: {
                            _gt: endDate,
                        },
                    },
                ],
                user: userEmails.length
                    ? {email: {_in: userEmails}}
                    : null,
            };
        }
        const variables = {
            projectWhere: projectWhereStatement,
            timerWhere: timerWhereStatement,
        };

      const query = `query project_v2($projectWhere:project_v2_bool_exp, $timerWhere:timer_v2_bool_exp){
            project_v2 (
                where: $projectWhere,
                order_by: {name: asc}
        ) {
                id
                name
                timer (
                    where: $timerWhere
            ) {
                    user {
                        id
                        email
                        username
                    }
                    start_datetime
                    end_datetime
                }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
                (res: AxiosResponse) => {
                    for (let i = 0; i < res.data.project_v2.length; i++) {
                        const project = res.data.project_v2[i];
                        this.timerService.limitTimeEntriesByStartEndDates(project.timer, startDate, endDate);
                    }
                    return resolve(res);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async addProject(project: Project, userId: string) {
        let { name } = project;
        name = name.trim();
        const { projectColorId, clientId, jiraProjectId = null } = project;

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;
        const slug = `${currentTeamId}-${slugify(name, { lower: true })}`;

        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        const isOwner =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_OWNER;

        if (jiraProjectId) {
            const projectList: any = await this.getProjectListWithJiraProject(userId, 'jira');
            const filteredProjects = projectList.data.project_v2.filter(
                item => item.jira_project_id === +jiraProjectId
            );
            if (!!filteredProjects.length) {
                return new Promise((resolve, reject) => {
                    reject({ message: 'ERROR.PROJECT.SYNC_FAILED', project: filteredProjects[0].name });
                });
            }
        }

        const query = `mutation insert_project_v2($objects:[project_v2_insert_input!]!){
                insert_project_v2:insert_project_v2(
                    objects: $objects
                ){
                    returning {
                        id
                    }
                }
            }`;

        const variables: any  = {
            objects: [
                {
                    name,
                    slug,
                    project_color_id: projectColorId,
                    team_id: currentTeamId,
                    client_id: isAdmin || isOwner ? clientId ? clientId : null : null,
                    jira_project_id: jiraProjectId,
                }
            ],
        };

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .graphql(query, variables)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getProjectById(userId: string, projectId: string) {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        const isOwner =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_OWNER;

        const clientQueryParam = isAdmin || isOwner ? `client { id, name, company_name }` : '';

        const query = `{
            project_v2(where: {id: {_eq: "${projectId}"}, team: {team_users: {user_id: {_eq: "${userId}"}}}}) {
                id
                name
                project_color {
                    id
                    name
                }
                jira_project_id
                ${clientQueryParam}
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async updateProjectById(id: string, project: Project, userId: string) {
        let { name } = project;
        name = name.trim();
        const { projectColorId, clientId, jiraProjectId = null } = project;

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;
        const slug = `${currentTeamId}-${slugify(name, { lower: true })}`;

        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        const isOwner =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_OWNER;

        if (jiraProjectId) {
            const projectList: any = await this.getProjectListWithJiraProject(userId, 'jira');
            const filteredProjects = projectList.data.project_v2.filter(
                item => item.jira_project_id === +jiraProjectId && item.id !== id
            );
            if (!!filteredProjects.length) {
                return new Promise((resolve, reject) => {
                    reject({ message: 'ERROR.PROJECT.SYNC_FAILED', project: filteredProjects[0].name });
                });
            }
        }

        let role = this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isOwner) {
            role = this.roleCollaborationService.ROLES_IDS.ROLE_OWNER;
        }

        const query = `mutation update_project_v2($where: project_v2_bool_exp!,$_set: project_v2_set_input){
                update_project_v2:update_project_v2(
                    where:$where,
                    _set: $_set
            ) {
                    returning {
                        id
                    }
                }
            }`;

        const variables: any = {
            where: {
                id: {
                    _eq: id,
                },
                team: {
                    team_users: {
                        user_id: {
                            _eq: userId,
                        },
                        role_collaboration_id: {
                            _eq: role,
                        },
                    },
                },
            },
            _set: {
                name,
                slug,
                project_color_id: projectColorId,
                client_id: isAdmin || isOwner ? clientId ? clientId : null : null,
                jira_project_id: jiraProjectId,
            },
        };

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
                (res: AxiosResponse) => {
                    if (!res.data.update_project_v2.returning[0]) {
                        return reject({
                            message: 'ERROR.PROJECT.UPDATE_FAILED',
                        });
                    }

                    return resolve(res);
                },
                (error: AxiosError) => reject(error)
            );
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
                const { email: userEmail, username, id } = user;

                const uniqueTimeEntryKey = `${issue}-${projectName}-${userEmail}-${j}`;
                const previousDuration = projectV2Report[uniqueTimeEntryKey]
                    ? projectV2Report[uniqueTimeEntryKey].durationTimestamp
                    : 0;
                const currentDuration =
                    this.timeService.getTimestampByGivenValue(endDatetime) -
                    this.timeService.getTimestampByGivenValue(startDatetime);
                projectV2Report[uniqueTimeEntryKey] = {
                    user: {
                        username,
                        email: userEmail,
                        id,
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
            projectV2ReportValues.sort(
                (a, b) =>
                    this.timeService.getTimestampByGivenValue(a['startDatetime']) -
                    this.timeService.getTimestampByGivenValue(b['startDatetime'])
            );
            for (let i = 0, projectV2ReportLength = projectV2ReportValues.length; i < projectV2ReportLength; i++) {
                let timeEntry = projectV2ReportValues[i];
                timeEntry['duration'] = this.timeService.getTimeDurationByGivenTimestamp(
                    timeEntry['durationTimestamp']
                );
            }

            data[i].timer = projectV2ReportValues.reverse();
        }
    }

    async getProjectsBySync(userId: string, typeSync: string) {
        let user: any = await this.userService.getUserById(userId);
        const { urlJira, tokenJira } = user;

        if (!urlJira || !tokenJira) {
            throw new Error('ERROR.PROJECTS.JIRA.GET_PROJECTS');
        }

        switch (typeSync) {
            case PROJECT_TYPES_TO_SYNC.JIRA:
                return await this.jiraService.getProjects(urlJira, tokenJira);
            default:
                return [];
        }
    }

    async getProjectListWithJiraProject(userID: string, slugSync: string) {
        const projectList: any = await this.getProjectList(userID, false, true);
        const jiraProjectList = await this.getProjectsBySync(userID, slugSync);
        projectList.data.project_v2 = projectList.data.project_v2.map(item => {
            if (item.jira_project_id) {
                item.jira_project = jiraProjectList.filter(itemJira => item.jira_project_id == itemJira.id)[0];
            }
            return item;
        });
        return projectList;
    }
}
