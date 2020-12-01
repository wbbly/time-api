import { Injectable } from '@nestjs/common';

import { Sync } from '../interfaces/sync.interface';
import { JiraAuthService } from '../../jira-auth/jira-auth.service';
import { HttpRequestsService } from '../../http-requests/http-requests.service';
import { AxiosError, AxiosResponse } from 'axios';

@Injectable()
export class JiraService implements Sync {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly jiraAuthService: JiraAuthService
    ) {}

    public getProjects(urlJira: string, token: string): Promise<any> {
        const tokenJiraDecrypted = this.jiraAuthService.decrypt(token);

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .requestJiraGet(`${urlJira.replace(/\/$/, '')}/rest/api/2/project`, tokenJiraDecrypted)
                .subscribe(
                    async (res: any) => {
                        return resolve(res.map((el: any) => ({ id: el.id, name: el.name })));
                    },
                    _ =>
                        reject({
                            message: 'ERROR.PROJECTS.JIRA.GET_PROJECTS',
                        })
                );
        });
    }

    async getIssues(urlJira: string, token: string, params) {
        const tokenJiraDecrypted = this.jiraAuthService.decrypt(token);

        return new Promise((resolve, reject) => {
            const queryString = Object.keys(params)
                .map(key => key + '=' + params[key])
                .join('&');
            this.httpRequestsService
                .requestJiraGet(
                    `${urlJira.replace(/\/$/, '')}/rest/api/2/search` + '?' + queryString,
                    tokenJiraDecrypted
                )
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getWorklogsByIssue(urlJira: string, token: string, issueId: string) {
        const tokenJiraDecrypted = this.jiraAuthService.decrypt(token);

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .requestJiraGet(`${urlJira.replace(/\/$/, '')}/rest/api/2/issue/${issueId}/worklog`, tokenJiraDecrypted)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getCurrentUser(urlJira: string, token: string) {
        const tokenJiraDecrypted = this.jiraAuthService.decrypt(token);

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .requestJiraGet(`${urlJira.replace(/\/$/, '')}/rest/api/2/myself`, tokenJiraDecrypted)
                .subscribe(
                    res => resolve(res),
                    _ =>
                        reject({
                            message: 'ERROR.SYNC.JIRA.GET_PROFILE',
                        })
                );
        });
    }
}
