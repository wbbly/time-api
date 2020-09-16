import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TeamService } from '../team/team.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';

@Injectable()
export class ClientService {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService
    ) {}

    async getClientList(userId: string) {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            const query = `{
                client(
                    where: {
                        team_id: {
                            _eq: "${currentTeamId}"
                        }
                    }
                    order_by: {created_at: asc}
                ) {
                    id
                    name
                    country
                    language
                    city
                    state
                    phone
                    avatar
                    email
                    zip
                    company_name
                    project {
                        id
                        name
                        project_color {
                            name
                        }
                    }
                }
            }`;

            return new Promise((resolve, reject) => {
                this.httpRequestsService
                    .request(query)
                    .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
            });
        } else {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    async addClient({ userId, name, language, country, city, state, phone, email, zip, avatar, companyName }) {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            const query = `mutation {
                insert_client(
                    objects: {
                        name: ${name ? '"' + name + '"' : null}
                        team_id: "${currentTeamId}"
                        language: ${language ? '"' + language + '"' : null}
                        avatar: ${avatar ? '"' + avatar + '"' : null}
                        country: ${country ? '"' + country + '"' : null}
                        city: ${city ? '"' + city + '"' : null}
                        state: ${state ? '"' + state + '"' : null}
                        phone: ${phone ? '"' + phone + '"' : null}
                        email: ${email ? '"' + email + '"' : null}
                        zip: ${zip ? '"' + zip + '"' : null}
                        company_name: "${companyName}"
                    }
                ) {
                    returning {
                        id
                    }
                }
            }`;

            return new Promise((resolve, reject) => {
                this.httpRequestsService
                    .request(query)
                    .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
            });
        } else {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    async deleteClient(userId: string, clientId: string) {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            const query = `mutation {
                delete_client(
                    where: {
                        id: {
                            _eq: "${clientId}"
                        }
                    }
                ) {
                    affected_rows
                }
            }`;

            return new Promise((resolve, reject) => {
                this.httpRequestsService
                    .request(query)
                    .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
            });
        } else {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    async patchClient({
        userId,
        clientId,
        name,
        language,
        country,
        city,
        state,
        phone,
        email,
        zip,
        avatar,
        companyName,
    }) {
        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            const query = `mutation {
                update_client(
                    where: {
                        id: {
                            _eq: "${clientId}"
                        },
                        team_id: {
                            _eq: "${currentTeamId}"
                        }
                    },
                    _set: {
                        name: ${name ? '"' + name + '"' : null}
                        language: ${language ? '"' + language + '"' : null}
                        avatar: ${avatar ? '"' + avatar + '"' : null}
                        country: ${country ? '"' + country + '"' : null}
                        city: ${city ? '"' + city + '"' : null}
                        state: ${state ? '"' + state + '"' : null}
                        phone: ${phone ? '"' + phone + '"' : null}
                        email: ${email ? '"' + email + '"' : null}
                        zip: ${zip ? '"' + zip + '"' : null}
                        company_name: "${companyName}"
                    }
                ) {
                    returning {
                        id
                    }
                }
            }`;

            return new Promise((resolve, reject) => {
                this.httpRequestsService
                    .request(query)
                    .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
            });
        } else {
            return Promise.reject({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    async getClientById(clientId: string) {
        const query = `{
            client(
                where: {
                    id: {
                        _eq: "${clientId}"
                    }
                }
            ) {
                id
                name
                avatar
                country
                language
                city
                state
                zip
                phone
                email
                company_name
            }
        }`;

        let client: any = null;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const data = res.data.client.shift();
                    if (data) {
                        client = data;
                    }

                    return resolve(client);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }
}
