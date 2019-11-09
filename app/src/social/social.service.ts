import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';

const SOCIAL_KEYS = {
    facebook: 'facebook_id',
};

@Injectable()
export class SocialService {
    constructor(private readonly httpRequestsService: HttpRequestsService) {}

    createSocialTable(): Promise<string | AxiosError> {
        const query = `mutation {
            insert_social(objects: {}) {
                returning {
                    id
                }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    let socialId = null;
                    try {
                        socialId = res.data.insert_social.returning[0].id;
                    } catch (error) {
                        console.log(error);
                    }
                    resolve(socialId);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    async addSocialTable(userId: string, socialId: string): Promise<AxiosResponse | AxiosError> {
        const query = `mutation {
            update_user (
                where: {
                    id: {
                        _eq: "${userId}"
                    }
                },
                _set: {
                    social_id: "${socialId}"
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
                .subscribe((res: AxiosResponse) => resolve(res), (res: AxiosError) => reject(res));
        });
    }

    checkSocialEntries(socialKey: string, value: string): Promise<boolean | AxiosError> {
        const query = `query {
            social(
                where: {
                    ${SOCIAL_KEYS[socialKey]}: {
                        _eq: "${value}"
                    }
                }
            ) {
                ${SOCIAL_KEYS[socialKey]}
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    if (res.data.social.length) {
                        reject({
                            message: 'ERROR.USER.THIS_FACEBOOK_ID_ALREADY_CONNECTED_TO_ANOTHER_ACCOUNT',
                        });
                    } else {
                        resolve(true);
                    }
                },
                (res: AxiosError) => reject(res)
            );
        });
    }

    async setSocial(userSocialId: string, socialKey: string, value: string | null): Promise<string | AxiosError> {
        const socialQueryParam = value ? `${SOCIAL_KEYS[socialKey]}: "${value}"` : `${SOCIAL_KEYS[socialKey]}: null`;
        const query = `mutation {
            update_social(
                where: {
                    id: {
                        _eq: "${userSocialId}"
                    }
                },
                _set: {
                    ${socialQueryParam}
                }
            ) {
                returning {
                    ${SOCIAL_KEYS[socialKey]}
                }
            }
        }`;

        if (!SOCIAL_KEYS[socialKey]) {
            return Promise.reject({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            await this.checkSocialEntries(socialKey, value);
        } catch (error) {
            Promise.reject(error)
        }

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const returning = res.data.update_social.returning;
                    if (returning.length) {
                        resolve(returning[0][SOCIAL_KEYS[socialKey]]);
                    } else {
                        resolve('');
                    }
                },
                (error: AxiosError) => reject(error)
            );
        });
    }
}
