import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TeamService } from '../team/team.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { ProjectService } from '../project/project.service';

@Injectable()
export class ClientService {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService,
        @Inject(forwardRef(() => ProjectService))
        private readonly projectService: ProjectService
    ) {}

    async getClientList(
        userId: string,
        filterParams?: {
            order_by?: string;
            sort?: string;
            isActive?: string;
            search?: string;
        }
    ) {
        let orderBy: string = 'created_at';
        let sort: string = 'asc';
        let isActive: string | null = null;
        let search: string | null = null;

        if (typeof filterParams !== 'undefined') {
            orderBy = filterParams.order_by || orderBy;
            sort = filterParams.sort || sort;
            isActive =
                filterParams.isActive === 'true' || filterParams.isActive === 'false'
                    ? filterParams.isActive
                    : isActive;
            search = filterParams.search || search;
        }

        let searchQuery: string = '';
        if (search) {
            searchQuery = `company_name: {_ilike: "%${search
                .toLowerCase()
                .trim()
                .replace(/"/g, '\\"')}%"}`;
        }

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const currentTeamId = currentTeamData.data.user_team[0].team.id;

        const { ROLE_ADMIN, ROLE_OWNER, ROLE_INVOICES_MANAGER } = this.roleCollaborationService.ROLES_IDS;

        const isAdmin = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_ADMIN;

        const isOwner = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_OWNER;

        const isInvoicesManager = currentTeamData.data.user_team[0].role_collaboration_id === ROLE_INVOICES_MANAGER;

        if (isAdmin || isOwner || isInvoicesManager) {
            const query = `{
                client(
                    where: {
                        team_id: {
                            _eq: "${currentTeamId}"
                        }
                        is_active: {
                            _eq: ${isActive}
                        }
                        ${searchQuery}
                    }
                    order_by: {${orderBy}: ${sort}}
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
                    is_active
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

        const isOwner =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_OWNER;

        if (isAdmin || isOwner) {
            const variables = {
                object: {
                    name: name || null,
                    team_id: currentTeamId,
                    language: language || null,
                    avatar: avatar || null,
                    country: country || null,
                    city: city || null,
                    state: state || null,
                    phone: phone || null,
                    email: email || null,
                    zip: zip || null,
                    company_name: companyName,
                },
            };

            const query = `mutation insert_client($object: [client_insert_input!]!) {
                            insert_client:insert_client(objects: $object) {
                                returning {
                                        id
                                    }
                                }
                            }`;

            return new Promise((resolve, reject) => {
                this.httpRequestsService
                    .graphql(query, variables)
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

        const isOwner =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_OWNER;

        if (isAdmin || isOwner) {
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

        const isOwner =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_OWNER;

        if (isAdmin || isOwner) {
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
                is_active
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

    async updateClientActiveStatus(clientId: string, isActive: boolean, withClientProjects: boolean = true) {
        const query = `mutation update_client($where: client_bool_exp!, $_set: client_set_input) {
            update_client(where: $where, _set: $_set) {
                returning {
                    id
                    team_id
                    is_active
                }
            }
        }`;

        const variables = {
            where: {
                id: {
                    _eq: clientId,
                },
            },
            _set: {
                is_active: isActive,
            },
        };

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
                async (res: AxiosResponse) => {
                    if (withClientProjects) {
                        const [client] = res.data.update_client.returning;
                        const { id, team_id: teamId } = client;
                        try {
                            const clientProjects = ((await this.projectService.getTeamProjectByClientId(
                                teamId,
                                id
                            )) as AxiosResponse).data.project_v2;

                            if (clientProjects.length) {
                                await this.projectService.updateProjectActiveStatus(
                                    clientProjects.map(project => project.id),
                                    isActive,
                                    false
                                );
                            }
                            return resolve(res);
                        } catch (error) {
                            return Promise.reject(error);
                        }
                    } else {
                        return resolve(res);
                    }
                },
                (error: AxiosError) => reject(error)
            );
        });
    }
}
