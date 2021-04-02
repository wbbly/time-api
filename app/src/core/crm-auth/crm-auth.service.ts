import { Injectable } from '@nestjs/common';

import { HttpRequestsService } from '../http-requests/http-requests.service';
import { AxiosResponse } from 'axios';
import { IAuthCrm } from './interfaces/crm-auth.iterface';

@Injectable()
export class CrmAuthService {
    constructor(private readonly httpRequestsService: HttpRequestsService) {}

    async authenticate(): Promise<any | { message: string }> {
        const URL: string = `${process.env.CRM_URL}/web/session/authenticate/`;

        if (!Boolean(process.env.CRM_AUTH_LOGIN) ||
            !Boolean(process.env.CRM_AUTH_PASSWORD) ||
            !Boolean(process.env.CRM_AUTH_DB)
        ) {
            return Promise.reject({
                message: 'Check for credentials.',
            });
        }

        const authCredentials: IAuthCrm = {
            jsonrpc: '2.0',
            params: {
                login: process.env.CRM_AUTH_LOGIN,
                password: process.env.CRM_AUTH_PASSWORD,
                db: process.env.CRM_AUTH_DB,
            },
        };

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService.requestCrmPost(URL, authCredentials).subscribe(
                async (res: AxiosResponse) => {
                    if (res.data.error) {
                        return reject({
                            message: res.data.error.message,
                        });
                    }
                    return resolve(res);
                },
                () => {
                    return reject({
                        message: 'ERROR.AUTHENTICATE.CRM',
                    });
                },
            );
        });
    }
}
