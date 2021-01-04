import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';

@Injectable()
export class SubscriptionService {
    constructor(private readonly httpRequestsService: HttpRequestsService) {}

    async getSubscriptions() {
        const query = `{
            subscriptions {
                id
                plan_id
                plan_name
                term
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getSubscriptionByPlanId(planId: string) {
        const variables = {
            where: {
                plan_id: {
                    _eq: planId,
                },
            },
        };

        const query = `query subscription ($where: subscriptions_bool_exp){
            subscription: subscriptions(where: $where) {
                id
                plan_id
                plan_name
                term
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .graphql(query, variables)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }
}
