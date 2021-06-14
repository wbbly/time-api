import { Injectable } from '@nestjs/common';

import { AxiosResponse } from 'axios';
import { HttpRequestsService } from '../../http-requests/http-requests.service';
import { CrmAuthService } from '../../crm-auth/crm-auth.service';

import { ISyncMail } from './interfaces/sync-mail.iterface';

@Injectable()
export class CrmService {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly crmAuthService: CrmAuthService
    ) {}

    async addUserEmailToCRM(email: string): Promise<any | { message: string }> {
        const URL: string = `${process.env.CRM_URL}/api/mailing.contact/`;

        if (!Boolean(process.env.CRM_URL)) {
            return Promise.reject({
                message: 'Check crm url availability.',
            });
        }

        let authResponseCRM = null;
        try {
            authResponseCRM = await this.crmAuthService.authenticate();
        } catch (error) {
            return Promise.reject(error);
        }

        const sessionIdCookies: string = authResponseCRM.headers['set-cookie'].find(header =>
            header.startsWith('session_id=')
        );

        const emailData: ISyncMail = {
            params: {
                data: {
                    email,
                },
            },
        };

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService.requestCrmPost(URL, emailData, sessionIdCookies).subscribe(
                async (res: AxiosResponse) => {
                    if (res.data.error) {
                        return reject({
                            message: res.data.error.message,
                        });
                    }
                    return resolve(res.data);
                },
                () => {
                    return reject({
                        message: 'ERROR.ADD.EMAIL.CRM',
                    });
                }
            );
        });
    }
}
