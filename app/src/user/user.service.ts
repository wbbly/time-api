import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';
import * as uuid from 'uuid';
import * as bcrypt from 'bcrypt';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { JiraAuthService } from '../core/jira-auth/jira-auth.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { TeamService } from '../team/team.service';
import { SocialService } from '../social/social.service';
import { AuthService } from '../auth/auth.service';
import { CrmService } from '../core/sync/crm/crm.service';
import { User } from './interfaces/user.interface';

const APP_VERSION = 'v1.0.7';
const DEFAULT_LANGUAGE = 'en';

export enum JIRA_TYPES {
    SELF = 'self',
    CLOUD = 'cloud',
}

@Injectable()
export class UserService {
    private salt = 10;

    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly jiraAuthService: JiraAuthService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly teamService: TeamService,
        private readonly socialService: SocialService,
        private readonly authService: AuthService,
        private readonly crmService: CrmService
    ) {}

    getUserList() {
        const query = `{
            user(order_by: {username: asc}) {
                    id,
                    username,
                    email,
                    is_active
                }
            }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getUserById(id: string): Promise<User | AxiosError> {
        const whereStatements = {
            where: {
                id: {
                    _eq: id,
                },
            },
        };

        return new Promise((resolve, reject) => {
            this.getUserData(whereStatements).then(
                (res: User) => resolve(res),
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getUserByEmail(email: string): Promise<User | AxiosError> {
        const whereStatements = {
            where: {
                email: {
                    _eq: email,
                },
            },
        };

        return new Promise((resolve, reject) => {
            this.getUserData(whereStatements).then(
                (res: User) => resolve(res),
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getUserBySocial(socialKey: string, socialId: string): Promise<User | AxiosError> {
        const whereStatements = {
            where: {
                social: {
                    [socialKey]: {
                        _eq: socialId,
                    },
                },
            },
        };

        return new Promise((resolve, reject) => {
            this.getUserData(whereStatements).then(
                (res: User) => resolve(res),
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getUserByResetPasswordHash(token: string): Promise<User | AxiosError> {
        const whereStatements = {
            where: {
                reset_password_hash: {
                    _eq: token,
                },
            },
        };

        return new Promise((resolve, reject) => {
            this.getUserData(whereStatements).then(
                (res: User) => resolve(res),
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getUserData(whereStatement: any): Promise<any | null | AxiosError> {
        const query = `query getUser($where: user_bool_exp){
            user(where: $where) {
                id
                username
                email
                password
                timezone_offset
                language
                token_jira
                url_jira
                type_jira
                login_jira
                phone
                social {
                    facebook_id
                }
                social_id
                avatar
                onboarding_mobile
                user_technologies {
                    technology {
                        id
                        title
                    }
                }
                country
                city
                state
                zip
                company_name
                last_invoice_number
            }
        }
        `;

        const variables = {
            ...whereStatement,
        };

        let user: any = null;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
                (res: AxiosResponse) => {
                    const data = res.data.user.shift();
                    if (data) {
                        const {
                            id: userId,
                            username,
                            email,
                            password,
                            timezone_offset: timezoneOffset,
                            language,
                            token_jira: tokenJira,
                            url_jira: urlJira,
                            type_jira: typeJira,
                            login_jira: loginJira,
                            phone,
                            social_id: socialId,
                            avatar,
                            onboarding_mobile: onboardingMobile,
                            user_technologies: userTechnologies,
                            country,
                            city,
                            state,
                            zip,
                            company_name: companyName,
                            last_invoice_number: lastInvoiceNumber,
                        } = data;

                        let { social } = data;
                        social = social && {
                            facebookId: social.facebook_id,
                        };

                        user = {
                            id: userId,
                            username,
                            email,
                            password,
                            timezoneOffset,
                            language,
                            tokenJira,
                            urlJira,
                            typeJira,
                            loginJira,
                            phone,
                            social,
                            socialId,
                            avatar,
                            onboardingMobile,
                            userTechnologies: userTechnologies,
                            country,
                            city,
                            state,
                            zip,
                            companyName,
                            lastInvoiceNumber,
                        };
                    }

                    return resolve(user);
                },
                (error: AxiosError) => reject(error),
            );
        });
    }

    getPublicUserData(user: User) {
        const {
            id,
            username,
            email,
            timezoneOffset,
            language,
            tokenJira,
            urlJira,
            typeJira,
            loginJira,
            phone,
            social,
            avatar,
            onboardingMobile,
            userTechnologies,
            country,
            city,
            state,
            zip,
            companyName,
        } = user;

        return {
            id,
            username,
            email,
            timezoneOffset,
            language,
            tokenJira,
            urlJira,
            typeJira,
            loginJira,
            phone,
            social,
            avatar,
            onboardingMobile,
            userTechnologies,
            country,
            city,
            state,
            zip,
            companyName,
        };
    }

    async checkUserExists(data: { email: string }): Promise<boolean> {
        const { email } = data;

        const query = `{
            user(where: { email: { _eq: "${email}" } }) {
                id
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const users = res.data.user || [];

                    return resolve(users.length > 0);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async getUserDataByTeam(id: string, teamId: string): Promise<AxiosResponse> {
        const query = `{
            user(where: {id: {_eq: "${id}"}}) {
                user_teams(where: {team_id: {_eq: "${teamId}"}}) {
                    is_active
                    current_team
                    role_collaboration_id
                    role_collaboration {
                        title
                    }
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

    async createUser(data: {
        username: string;
        email: string;
        password: string;
        language?: string;
        timezoneOffset: number;
    }): Promise<AxiosResponse | AxiosError> {
        const { username, email, password, language, timezoneOffset } = data;
        const passwordHash = await this.getHash(password);
        const socialId = await this.socialService.createSocialTable();

        const insertUserQuery = `mutation insert_user($userName: String, $email: String){
            insert_user(
                objects: [
                    {
                        username: $userName
                        email: $email,
                        password: "${passwordHash}",
                        social_id: "${socialId}",
                        language: "${language || DEFAULT_LANGUAGE}",
                        is_active: true,
                        timezone_offset: "${timezoneOffset}"
                    }
                ]
            ){
                returning {
                    id
                }
            }
        }
        `;

        const variables = {
            userName: username,
            email,
        };

        return new Promise((resolve, reject) => {
            this.httpRequestsService.graphql(insertUserQuery, variables).subscribe(
                async (insertUserRes: AxiosResponse) => {
                    const returningRows = insertUserRes.data.insert_user.returning;
                    if (returningRows.length) {
                        const userId = insertUserRes.data.insert_user.returning[0].id;

                        try {
                            await this.teamService.createTeam(userId);
                        } catch (error) {
                            console.log(error);
                        }

                        try {
                            await this.crmService.addUserEmailToCRM(email);
                        } catch (error) {
                            console.log(error);
                        }

                        return resolve(insertUserRes);
                    } else {
                        return resolve(insertUserRes);
                    }
                },
                (insertUserError: AxiosError) => reject(insertUserError)
            );
        });
    }

    async updateUser(
        userId: string,
        data: {
            username: string;
            email: string;
            language: string;
            tokenJira: string;
            urlJira: string;
            typeJira: string;
            loginJira: string;
            phone: string;
            onboardingMobile: boolean;
            technologies?: string[];
            country: string;
            city: string;
            state: string;
            zip: string;
            companyName: string;
        }
    ): Promise<AxiosResponse | AxiosError> {
        const {
            username,
            email,
            language,
            tokenJira,
            urlJira,
            typeJira,
            loginJira,
            phone,
            onboardingMobile,
            technologies,
            country,
            city,
            state,
            zip,
            companyName,
        } = data;

        const tokenJiraEncrypted = this.jiraAuthService.encrypt(tokenJira);

        const variables = {
            username,
            companyName,
            state: state ? state : null,
            city: city ? city : null,
            email,
        };
        const query = `mutation updateUser(
        $username: String,
        $companyName: String,
        $state: String,
        $city: String,
        $email: String
        ) {
                update_user(
                where: {
                    id: {_eq: "${userId}"}
                },
                _set: {
                    username: $username
                    email: $email
                    language: "${language}"
                    token_jira: ${tokenJiraEncrypted ? '"' + tokenJiraEncrypted + '"' : null}
                    url_jira: ${tokenJira ? (urlJira ? '"' + urlJira.replace(/\/$/, '') + '"' : null) : null}
                    type_jira: ${
                        tokenJira
                            ? typeJira
                                ? '"' + (typeJira === JIRA_TYPES.SELF ? JIRA_TYPES.SELF : JIRA_TYPES.CLOUD) + '"'
                                : null
                            : null
                    }
                    login_jira: ${loginJira ? '"' + loginJira + '"' : null}
                    phone: ${phone ? '"' + phone + '"' : null},
                    onboarding_mobile: ${onboardingMobile === true ? true : false},
                    country: ${country ? '"' + country + '"' : null},
                    city: $city,
                    state: $state,
                    zip: ${zip ? '"' + zip + '"' : null},
                    company_name: $companyName
                }
            ) {
                returning {
                    id
                }
            }
        }`;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService.graphql(query, variables).subscribe(
                async (res: AxiosResponse) => {
                    await this.updateUserTechnologies(userId, technologies);

                    return resolve(res);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async updateUserAvatar(userId: string, avatar: string): Promise<AxiosResponse | AxiosError> {
        const query = `mutation {
            update_user(
                where: {
                    id: {_eq: "${userId}"}
                },
                _set: {
                    avatar: ${avatar ? '"' + avatar + '"' : null}
                }
            ) {
                returning {
                    id
                }
            }
        }`;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async deleteUserFromTeam(adminTeamId: string, userId: string): Promise<AxiosResponse | AxiosError> {
        const variables = {
            where: {
                team_id: {
                    _eq: adminTeamId,
                },
                user_id: {
                    _eq: userId,
                },
            },
        };

        const query = `mutation delete_user_team($where: user_team_bool_exp!) {
            delete_user_team: delete_user_team(where: $where) {
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

    async updateUserInTeam(
        adminId: string,
        adminTeamId: string,
        userId: string,
        userData: {
            username: string;
            email: string;
            isActive: boolean;
            roleName: string;
            technologies?: string[];
        }
    ): Promise<AxiosResponse | AxiosError> {
        const { username, email, isActive, roleName, technologies } = userData;

        const roleId = this.roleCollaborationService.ROLES_IDS[roleName];

        const query = `mutation updateUser($userName: String, $email: String){
            update_user(
                where: {
                    id: {_eq: "${userId}"},
                    user_teams: {team_id: {_eq: "${adminTeamId}"}}
                },
                _set: {
                    username: $userName
                    email: $email
                }
            ) {
                returning {
                    id
                }
            }
        }`;

        const updateUserVariables = {
            userName: username,
            email,
        };

        const updateTeamRoleQuery = `mutation{
            update_user_team(
                where: {
                    user_id: { _eq: "${userId}"},
                    team_id: { _eq: "${adminTeamId}"}
                },
                _set: {
                    role_collaboration_id: "${roleId}"
                    is_active: ${isActive}
                }
            ) {
                returning {
                    id
                    current_team
                }
            }
        }
        `;

        return new Promise(async (resolve, reject) => {
            let ownTeamList = [];
            try {
                const ownerUserTeams = await this.teamService.getOwnerUserTeams(userId);
                ownTeamList = ownerUserTeams.data.team;
                for (const ownTeam of ownTeamList) {
                    if (ownTeam.id === adminTeamId && roleId === this.roleCollaborationService.ROLES_IDS.ROLE_MEMBER) {
                        if (adminId === userId) {
                            return reject({
                                message: 'ERROR.USER.UPDATE_USER_ROLE_FAILED',
                            });
                        } else {
                            return reject({
                                message: 'ERROR.USER.UPDATE_TEAM_OWNER_ROLE_FAILED',
                            });
                        }
                    } else if (ownTeam.id === adminTeamId && isActive === false) {
                        if (adminId === userId) {
                            return reject({
                                message: 'ERROR.USER.UPDATE_ACTIVE_STATUS_FAILED',
                            });
                        } else {
                            return reject({
                                message: 'ERROR.USER.UPDATE_TEAM_OWNER_ACTIVE_STATUS_FAILED',
                            });
                        }
                    }
                }
            } catch (e) {
                const error: AxiosError = e;
                return reject(error);
            }

            this.httpRequestsService.graphql(query, updateUserVariables).subscribe(
                async (res: AxiosResponse) => {
                    await this.updateUserTechnologies(userId, technologies);

                    this.httpRequestsService.request(updateTeamRoleQuery).subscribe(
                        async (updateTeamRoleQueryRes: AxiosResponse) => {
                            const returningRows = updateTeamRoleQueryRes.data.update_user_team.returning;
                            if (returningRows.length) {
                                const currentTeam = returningRows[0].current_team;

                                if (currentTeam && !isActive) {
                                    if (ownTeamList.length) {
                                        const lastOwnerTeam = ownTeamList[0];
                                        await this.teamService.switchTeam(userId, lastOwnerTeam.id);

                                        return resolve(updateTeamRoleQueryRes);
                                    } else {
                                        const resetCurrentTeamQuery = `mutation{
                                            update_user_team(
                                                where: {
                                                    user_id: { _eq: "${userId}"},
                                                    team_id: { _eq: "${adminTeamId}"}
                                                },
                                                _set: {
                                                    current_team: false
                                                }
                                            ) {
                                                returning {
                                                    id
                                                }
                                            }
                                        }
                                        `;

                                        this.httpRequestsService
                                            .request(resetCurrentTeamQuery)
                                            .subscribe(
                                                (resetCurrentTeamQueryRes: AxiosResponse) =>
                                                    resolve(resetCurrentTeamQueryRes),
                                                (resetCurrentTeamQueryError: AxiosError) =>
                                                    reject(resetCurrentTeamQueryError)
                                            );
                                    }
                                } else {
                                    return resolve(updateTeamRoleQueryRes);
                                }
                            } else {
                                return resolve(updateTeamRoleQueryRes);
                            }
                        },
                        (updateTeamRoleQueryError: AxiosError) => reject(updateTeamRoleQueryError)
                    );
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async updateUserTechnologies(userId: string, technologies: string[]): Promise<AxiosResponse | AxiosError> {
        const removeUserTechnologies = `mutation {
            delete_user_technology(
                where: {
                    user_id: {_eq: "${userId}"}
                },
            ) {
                returning {
                    user_id
                    technology_id
                }
            }
        }`;

        const insertUserTechnologies = `mutation {
            insert_user_technology(
                objects: [${technologies.map(el => `{ user_id: "${userId}", technology_id: "${el}" }`)}]
            ) {
                returning {
                    user_id
                    technology_id
                }
            }
        }`;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService.request(removeUserTechnologies).subscribe(
                (removeTechnologyRes: AxiosResponse) => {
                    if (!technologies.length) {
                        return resolve(removeTechnologyRes);
                    }

                    this.httpRequestsService
                        .request(insertUserTechnologies)
                        .subscribe(
                            (insertTechnologyRes: AxiosResponse) => resolve(insertTechnologyRes),
                            (insertTechnologyError: AxiosError) => reject(insertTechnologyError)
                        );
                },
                (removeTechnologyError: AxiosError) => reject(removeTechnologyError)
            );
        });
    }

    async resetPassword(email: string): Promise<AxiosResponse> {
        return new Promise((resolve, reject) => {
            const resetPasswordQuery = `mutation {
                update_user(
                    where: {
                        email: {_eq: "${email}"}
                    },
                    _set: {
                        reset_password_hash: "${uuid.v4()}"
                    }
                ) {
                    returning {
                        id
                        reset_password_hash
                    }
                }
            }
            `;

            this.httpRequestsService
                .request(resetPasswordQuery)
                .subscribe(
                    (resetPasswordResponse: AxiosResponse) => resolve(resetPasswordResponse),
                    (resetPasswordError: AxiosError) => reject(resetPasswordError)
                );
        });
    }

    async setPassword(resetPasswordHash: string, password: string): Promise<AxiosResponse> {
        const passwordHash = await this.getHash(password);

        return new Promise((resolve, reject) => {
            const setPasswordQuery = `mutation {
                update_user(
                    where: {
                        reset_password_hash: {_eq: "${resetPasswordHash}"}
                    },
                    _set: {
                        reset_password_hash: null
                        password: "${passwordHash}"
                    }
                ) {
                    returning {
                        id
                        email
                    }
                }
            }
            `;

            this.httpRequestsService
                .request(setPasswordQuery)
                .subscribe(
                    (setPasswordResponse: AxiosResponse) => resolve(setPasswordResponse),
                    (setPasswordError: AxiosError) => reject(setPasswordError)
                );
        });
    }

    async changePassword(userId: string, newPassword: string): Promise<AxiosResponse> {
        const passwordHash = await this.getHash(newPassword);

        return new Promise((resolve, reject) => {
            const changePasswordQuery = `mutation {
                update_user(
                    where: {
                        id: {_eq: "${userId}"}
                    },
                    _set: {
                        password: "${passwordHash}"
                    }
                ) {
                    returning {
                        id
                        email
                    }
                }
            }
            `;

            this.httpRequestsService
                .request(changePasswordQuery)
                .subscribe(
                    (changePasswordResponse: AxiosResponse) => resolve(changePasswordResponse),
                    (changePasswordError: AxiosError) => reject(changePasswordError)
                );
        });
    }

    async signIn(user: User): Promise<any> {
        return await this.authService.signIn({
            id: user.id,
            appVersion: APP_VERSION,
        });
    }

    async getHash(password: string | undefined): Promise<string> {
        return bcrypt.hash(password, this.salt);
    }

    async compareHash(password: string | undefined, hash: string | undefined): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    async updateUserTimezoneOffset(userId: string, timezoneOffset: number): Promise<AxiosResponse | AxiosError> {
        const query = `mutation {
            update_user(
                where: {
                    id: {_eq: "${userId}"}
                },
                _set: {
                    timezone_offset: "${timezoneOffset}"
                }
            ) {
                returning {
                    id
                }
            }
        }`;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async updateUserLastLogin(userId: string, date: string): Promise<AxiosResponse | AxiosError> {
        const query = `mutation {
            update_user(
                where: {
                    id: {_eq: "${userId}"}
                },
                _set: {
                    last_login: "${date}"
                }
            ) {
                returning {
                    id
                }
            }
        }`;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getUserByRoleInTeam(teamId: string, roleId: string): Promise<AxiosResponse | AxiosError> {
        const query = `{
            user_team(where: {
                is_active: {
                    _eq: true
                },
                role_collaboration_id: {
                    _eq: "${roleId}"
                },
                team_id: {
                    _eq: "${teamId}"
                }
            }) {
                is_active
                user_id
                role_collaboration_id
                role_collaboration {
                    title
                }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }
}
