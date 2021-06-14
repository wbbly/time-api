import { forwardRef, Inject, Injectable } from '@nestjs/common';
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
import { ClientService } from '../client/client.service';

export enum PROJECT_TYPES_TO_SYNC {
    JIRA = 'jira',
}

@Injectable()
export class ProjectService {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        @Inject(forwardRef(() => TimerService))
        private readonly timerService: TimerService,
        private readonly timeService: TimeService,
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly jiraService: JiraService,
        private readonly userService: UserService,
        @Inject(forwardRef(() => ClientService))
        private readonly clientService: ClientService
    ) {}

    async getProjectList(
        userId: string,
        withTimerList: boolean,
        withJiraID: boolean = false,
        isActive: boolean | null,
        withUserProject?: boolean,
        page?: string,
        limit?: string,
        searchValue?: string
    ): Promise<AxiosResponse | AxiosError> {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const {
            team_id: currentTeamId,
            role_collaboration_id: roleCollaborationId,
        } = currentTeamData.data.user_team[0];

        const { ROLE_OWNER, ROLE_ADMIN, ROLE_MEMBER } = this.roleCollaborationService.ROLES_IDS;

        const isAdmin = roleCollaborationId === ROLE_ADMIN;
        const isOwner = roleCollaborationId === ROLE_OWNER;
        const isMember = roleCollaborationId === ROLE_MEMBER;

        let amountQuery = '';
        let searchQuery = '';
        let clientQueryParam = '';
        let timerWhereStatement = `(where: {user_id: {_eq: "${userId}"}})`;
        const availableProjects = isOwner ? '' : `user_projects: {user_id: {_eq: "${userId}"}}`;
        // only where userId exist in user_projects
        const availableUserProjects = isOwner || isAdmin ? '' : `user_id: {_eq: "${userId}"}`;
        // member can't see rest of users in user_projects

        if (page && limit) {
            const offset = +page === 1 ? 0 : +limit * (+page - 1);
            amountQuery = `limit: ${limit}, offset: ${offset}`;
        }

        if (searchValue) {
            searchQuery = `name: {_ilike: "%${searchValue
                .toLowerCase()
                .trim()
                .replace(/"/g, '\\"')}%"}`;
        }

        if (isOwner || isAdmin) {
            clientQueryParam = `client { id, name, company_name }`;
            timerWhereStatement = '';
        }

        const query = `{
            project_v2(
                order_by: {name: asc}
                where: {
                    team_id: { _eq: "${currentTeamId}" }
                    is_active: { _eq: ${isActive} }
                    ${availableProjects},
                    ${searchQuery}
                }
                ${amountQuery}
            ) {
                id
                name
                is_active
                project_color {
                    name
                }
                ${
                    withUserProject
                        ? `user_projects(
                            where: {
                                ${availableUserProjects}
                            }
                        ) {
                            user {
                                  id
                                  email
                                  username
                                  avatar
                                  user_teams(where: {team_id: {_eq: "${currentTeamId}"}}) {
                                      role_collaboration {
                                        title
                                      }
                                  }
                            }
                        }`
                        : ``
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
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => resolve(res),
                (err: AxiosError) => reject(err),
            );
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
        combined?: boolean
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
            _and: [
                {
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
                },
                {
                    _or: [
                        {
                            title: taskName ? { _ilike: `%${taskName.toLowerCase().trim()}%` } : null,
                        },
                        {
                            issue: taskName ? { _ilike: `%${encodeURI(taskName)}%` } : null,
                        },
                    ],
                },
            ],
            user: userEmails.length ? { email: { _in: userEmails } } : null,
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
                    combined
                        ? this.prepareCombinedReportsProjectData(res.data.project_v2, startDate, endDate)
                        : this.prepareReportsProjectData(res.data.project_v2, startDate, endDate);
                    return resolve(res);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getReportsProjects(
        userId: string,
        projectNames: string[],
        userEmails: string[],
        startDate: string,
        endDate: string,
    ) {
        let user: any = null;
        try {
            user = await this.userService.getUserById(userId);
        } catch (error) {
            console.log(error);
        }

        if (!user) {
            return Promise.reject({ message: 'ERROR.USER.NOT_EXIST' });
        }

        let teamId = null;
        let currentTeamRes = null;
        try {
            currentTeamRes = await this.teamService.getCurrentTeam(userId);
            teamId = (currentTeamRes as AxiosResponse).data.user_team[0].team.id;
        } catch (error) {
            console.log(error);
        }

        if (!teamId) {
            return Promise.reject({ message: 'ERROR.USER.NOT_MEMBER' });
        }

        const { ROLE_ADMIN, ROLE_OWNER } = this.roleCollaborationService.ROLES_IDS;
        const { role_collaboration_id } = currentTeamRes.data.user_team[0];

        const isAdmin = role_collaboration_id === ROLE_ADMIN;
        const isOwner = role_collaboration_id === ROLE_OWNER;

        const projectWhereStatement: any = {
            team_id: {
                _eq: teamId,
            },
            name: projectNames.length ? { _in: projectNames } : null,
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
            };
            if (!isOwner && !isAdmin) {
                timerWhereStatement['user_id'] = { _eq: userId };
            }
            if (isOwner || isAdmin) {
                if (userEmails.length === 1) {
                    if (userEmails[0] === user.email) {
                        timerWhereStatement['user_id'] = { _eq: userId };
                    } else {
                        timerWhereStatement['user'] = { email: { _eq: userEmails[0] } };
                    }
                }
                if (userEmails.length > 1) {
                    timerWhereStatement['user'] = { email: { _in: userEmails } };
                }
            }

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

        if (clientId) {
            const client: any = await this.clientService.getClientById(clientId);
            const { is_active: isActive } = client;
            if (!isActive) {
                return Promise.reject({ message: 'Client must be not archived.' });
            }
        }

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

        const variables: any = {
            objects: [
                {
                    name,
                    slug,
                    project_color_id: projectColorId,
                    team_id: currentTeamId,
                    client_id: isAdmin || isOwner ? (clientId ? clientId : null) : null,
                    jira_project_id: jiraProjectId,
                },
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

        if (clientId) {
            const client: any = await this.clientService.getClientById(clientId);
            const { is_active: isActive } = client;
            if (!isActive) {
                return Promise.reject({ message: 'Client must be not archived.' });
            }
        }

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
                client_id: isAdmin || isOwner ? (clientId ? clientId : null) : null,
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

    private prepareCombinedReportsProjectData(data: any, startDate: string, endDate: string): void {
        for (let i = 0; i < data.length; i++) {
            const projectV2 = data[i];
            this.timerService.limitTimeEntriesByStartEndDates(projectV2.timer, startDate, endDate);

            const projectV2Report = {};
            for (let j = 0; j < projectV2.timer.length; j++) {
                const timeEntry = projectV2.timer[j];
                const { issue, start_datetime: startDatetime, end_datetime: endDatetime, project, user } = timeEntry;
                const { name: projectName } = project;
                const { email: userEmail, username, id } = user;

                const decodedIssue = issue ? decodeURI(issue).replace(/(\r\n|\n|\r)/g, '') : '';

                const re = /[\d*.,\d]+(\s*)+[a-z|\p{L}.]+(\s*)+\|+(\s*)/gu; // match pattern "2.5h | WOB-1252", "6,5 시간 | WOB-1252" when before issue located estimate from Jira
                const findEstimateFromJira = decodedIssue.match(re);

                const issueName = Array.isArray(findEstimateFromJira)
                    ? decodedIssue
                          .replace(re, '')
                          .split(' ', 1)
                          .join()
                    : decodedIssue.split(' ', 1).join();

                const uniqueTimeEntryKey = `${issueName}-${projectName}-${userEmail}`;
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
                    issue: issueName,
                    durationTimestamp: previousDuration + currentDuration,
                };
            }

            const projectV2ReportValues = Object.values(projectV2Report);
            projectV2ReportValues.sort((a, b) => b['issue'].replace(/[^\d]/g, '') - a['issue'].replace(/[^\d]/g, ''));

            for (let i = 0, projectV2ReportLength = projectV2ReportValues.length; i < projectV2ReportLength; i++) {
                let timeEntry = projectV2ReportValues[i];
                timeEntry['duration'] = this.timeService.getTimeDurationByGivenTimestamp(
                    timeEntry['durationTimestamp']
                );
            }
            data[i].timer = projectV2ReportValues;
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
        const projectList: any = await this.getProjectList(userID, false, true, null, true);
        const jiraProjectList = await this.getProjectsBySync(userID, slugSync);
        projectList.data.project_v2 = projectList.data.project_v2.map(item => {
            if (item.jira_project_id) {
                item.jira_project = jiraProjectList.filter(itemJira => item.jira_project_id == itemJira.id)[0];
            }
            return item;
        });
        return projectList;
    }

    async updateProjectActiveStatus(projectId: string[], isActive: boolean, withProjectClient: boolean = true) {
        const query = `mutation update_project_v2($where: project_v2_bool_exp!, $_set: project_v2_set_input) {
            update_project_v2(where: $where, _set: $_set) {
                returning {
                    id
                    is_active
                    client_id
                }
            }
        }`;

        const variables = {
            where: {
                id: {
                    _in: projectId,
                },
            },
            _set: {
                is_active: isActive,
            },
        };

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
                async (res: AxiosResponse) => {
                    const [{ client_id: clientId }] = res.data.update_project_v2.returning;
                    if (!clientId) {
                        return resolve(res);
                    }
                    const client: any = await this.clientService.getClientById(clientId);
                    const { is_active: isActiveClient } = client;

                    if (isActive && withProjectClient && !isActiveClient) {
                        await this.clientService.updateClientActiveStatus(clientId, !isActiveClient, false);
                    }
                    return resolve(res);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getTeamProjectByClientId(teamId: string, clientId: string) {
        const query = `query project_v2($where:project_v2_bool_exp) {
            project_v2(where: $where ) {
                id
                name
            }
        }`;

        const variables = {
            where: {
                client_id: {
                    _eq: clientId,
                },
                team_id: {
                    _eq: teamId,
                },
            },
        };

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .graphql(query, variables)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async addProjectUser(projectId: string, userId: string, users: string[]): Promise<void | AxiosError> {
        const arrDiff = (arr1, arr2) => arr1.filter(item1 => !arr2.some(item2 => item2 === item1));
        // returns arr of item which are contained in the arr1 but not contained in the arr2

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const {
            team_id: teamId,
            team: { name },
            role_collaboration_id: roleCollaborationId,
        } = currentTeamData.data.user_team[0];

        const { ROLE_OWNER, ROLE_ADMIN, ROLE_MEMBER } = this.roleCollaborationService.ROLES_IDS;
        const isAdmin = roleCollaborationId === ROLE_ADMIN;
        const isOwner = roleCollaborationId === ROLE_OWNER;
        const isMember = roleCollaborationId === ROLE_MEMBER;

        if (isMember) {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }

        let teamUsersData = null;
        try {
            teamUsersData = ((await this.userService.getTeamUserList(teamId)) as AxiosResponse).data.user_team;
            const teamUsers = teamUsersData.map(user => user.user_id);

            const userNotTeamMember = arrDiff(users, teamUsers);
            if (userNotTeamMember.length) {
                return Promise.reject(`Users with id ${userNotTeamMember.join(', ')} not exist in team ${name}`);
            }
        } catch (error) {
            return Promise.reject(error);
        }

        let teamAdmins = null;
        try {
            const teamAdminsRes = ((await this.userService.getUserByRoleInTeam(teamId, ROLE_ADMIN)) as AxiosResponse)
                .data.user_team;
            teamAdmins = teamAdminsRes.map(admin => admin.user_id);
        } catch (error) {
            return Promise.reject(error);
        }

        let teamOwner = null;
        try {
            const teamOwnerRes = ((await this.userService.getUserByRoleInTeam(teamId, ROLE_OWNER)) as AxiosResponse)
                .data.user_team;
            teamOwner = teamOwnerRes[0].user_id;
        } catch (error) {
            return Promise.reject(error);
        }

        if (!users.find(user => user === teamOwner)) {
            users.push(teamOwner);
        }

        const adminsToAdd = arrDiff(teamAdmins, users);
        if (adminsToAdd.length) {
            adminsToAdd.forEach(admin => users.push(admin));
        }

        const usersInactiveInTeam = teamUsersData.filter(user => user.is_active === false).map(user => user.user_id);

        const usersInactiveToAdd = usersInactiveInTeam.filter(user => users.includes(user));
        if (usersInactiveToAdd.length) {
            users = users.filter(user => !usersInactiveToAdd.includes(user));
        }

        if (isAdmin || isOwner) {
            try {
                await this.addProjectUserQuery([projectId], users);
            } catch (err) {
                return Promise.reject(err);
            }
        }
    }

    async updateProjectUser(projectId: string, userId: string, users: string[]): Promise<void | AxiosError> {
        const arrDiff = (arr1, arr2) => arr1.filter(item1 => !arr2.some(item2 => item2 === item1));
        // returns arr of item which are contained in the arr1 but not contained in the arr2

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const {
            team_id: teamId,
            team: { name },
            role_collaboration_id: roleCollaborationId,
        } = currentTeamData.data.user_team[0];

        const { ROLE_OWNER, ROLE_ADMIN, ROLE_MEMBER } = this.roleCollaborationService.ROLES_IDS;
        const isAdmin = roleCollaborationId === ROLE_ADMIN;
        const isOwner = roleCollaborationId === ROLE_OWNER;
        const isMember = roleCollaborationId === ROLE_MEMBER;

        if (isMember) {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }

        let teamUsersData = null;
        try {
            teamUsersData = ((await this.userService.getTeamUserList(teamId)) as AxiosResponse).data.user_team;
            const teamUsers = teamUsersData.map(user => user.user_id);

            const userNotTeamMember = arrDiff(users, teamUsers);
            if (userNotTeamMember.length) {
                return Promise.reject(`Users with id ${userNotTeamMember.join(', ')} not exist in team ${name}`);
            }
        } catch (error) {
            return Promise.reject(error);
        }

        let usersInProject = null;
        try {
            const usersInProjectRes = ((await this.userService.getUserListByProjectId(projectId)) as AxiosResponse).data
                .user;
            usersInProject = usersInProjectRes.map(user => user.id);
        } catch (error) {
            return Promise.reject(error);
        }

        let teamAdmins = null;
        try {
            const teamAdminsRes = ((await this.userService.getUserByRoleInTeam(teamId, ROLE_ADMIN)) as AxiosResponse)
                .data.user_team;
            teamAdmins = teamAdminsRes.map(admin => admin.user_id);
        } catch (error) {
            return Promise.reject(error);
        }

        let teamOwner = null;
        try {
            const teamOwnerRes = ((await this.userService.getUserByRoleInTeam(teamId, ROLE_OWNER)) as AxiosResponse)
                .data.user_team;
            teamOwner = teamOwnerRes[0].user_id;
        } catch (error) {
            return Promise.reject(error);
        }

        if (isOwner || isAdmin) {
            if (!users.length) {
                users.push(teamOwner);
                teamAdmins.forEach(admin => users.push(admin));
            } else {
                if (!users.find(user => user === teamOwner)) {
                    users.push(teamOwner);
                }
                const adminsToAdd = arrDiff(teamAdmins, users);
                if (adminsToAdd.length) {
                    adminsToAdd.forEach(admin => users.push(admin));
                }
            }
        }

        const usersInactiveInTeam = teamUsersData.filter(user => user.is_active === false).map(user => user.user_id);

        const usersInactiveToAdd = usersInactiveInTeam.filter(user => users.includes(user));
        if (usersInactiveToAdd.length) {
            users = users.filter(user => !usersInactiveToAdd.includes(user));
        }

        try {
            const usersToDelete = arrDiff(usersInProject, users);
            if (usersToDelete.length) {
                await this.deleteProjectUserQuery([projectId], usersToDelete);
            }

            const usersToAdd = arrDiff(users, usersInProject);
            if (usersToAdd.length) {
                await this.addProjectUserQuery([projectId], usersToAdd);
            }
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async addProjectUserQuery(projects: string[], users: string[]) {
        const query = `mutation insert_user_project($objects: [user_project_insert_input!]!){
                                        insert_user_project:insert_user_project(objects: $objects) {
                                                returning {
                                                    id
                                                }
                                            }
                                        }`;

        const userProjects = [];
        for (const projectId of projects) {
            users.forEach(userId => userProjects.push({ user_id: userId, project_id: projectId }));
        }

        const variables = {
            objects: userProjects,
        };

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .graphql(query, variables)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async deleteProjectUserQuery(projectId: string[], users: string[]) {
        const query = `mutation delete_user_project($where: user_project_bool_exp!) {
                            delete_user_project: delete_user_project(where: $where) {
                                affected_rows
                                returning {
                                    id
                                }
                            }
                        }`;

        const variables = {
            where: {
                project_id: {
                    _in: projectId,
                },
                user_id: {
                    _in: users,
                },
            },
        };

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .graphql(query, variables)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async deleteProjectUserById(
        projectId: string,
        userId: string,
        userToDelete: string
    ): Promise<AxiosResponse | AxiosError> {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const { team_id: teamId, role_collaboration_id: roleCollaborationId } = currentTeamData.data.user_team[0];

        const { ROLE_OWNER, ROLE_ADMIN, ROLE_MEMBER } = this.roleCollaborationService.ROLES_IDS;
        const isAdmin = roleCollaborationId === ROLE_ADMIN;
        const isOwner = roleCollaborationId === ROLE_OWNER;
        const isMember = roleCollaborationId === ROLE_MEMBER;

        let teamAdmins = null;
        try {
            teamAdmins = ((await this.userService.getUserByRoleInTeam(teamId, ROLE_ADMIN)) as AxiosResponse).data
                .user_team;
            teamAdmins = teamAdmins.map(admin => ({ id: admin.user_id }));
        } catch (error) {
            return Promise.reject(error);
        }

        let teamOwner = null;
        try {
            teamOwner = ((await this.userService.getUserByRoleInTeam(teamId, ROLE_OWNER)) as AxiosResponse).data
                .user_team;
        } catch (error) {
            return Promise.reject(error);
        }

        if (isMember) {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }

        if (isAdmin || isOwner) {
            if (userToDelete === teamOwner[0].user_id) {
                return Promise.reject({ message: 'ERROR.CANNOT.REMOVE.OWNER' });
            }
            if (teamAdmins.find(admin => admin.id === userToDelete)) {
                return Promise.reject({ message: 'ERROR.CANNOT.REMOVE.ADMIN' });
            }
            const variables = {
                where: {
                    project_id: {
                        _eq: projectId,
                    },
                    user_id: {
                        _eq: userToDelete,
                    },
                },
            };

            const query = `mutation delete_user_project($where: user_project_bool_exp!) {
                            delete_user_project: delete_user_project(where: $where) {
                              returning {
                                id
                              }
                            }
                        }`;

            return new Promise(async (resolve, reject) => {
                this.httpRequestsService
                    .graphql(query, variables)
                    .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
            });
        }
    }

    async getProjectUserQuery(projectId: string, userId: string): Promise<AxiosResponse | AxiosError> {
            const query = `query {
            user_project(
                where: {
                        user_id: {_eq: "${userId}"}
                        project_id: {_eq: "${projectId}"}
                }
            ) {
                    id
                    project_id
                    user_id
                }
            }`;

            return new Promise((resolve, reject) => {
                this.httpRequestsService
                    .request(query)
                    .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
            });

    }

    async getProjectTeam(teamId: string): Promise<AxiosResponse | AxiosError> {
        const query = `{
                          project_v2(where: {team_id: {_eq: "${teamId}"}}) {
                            id
                            name
                          }
                        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }
}
