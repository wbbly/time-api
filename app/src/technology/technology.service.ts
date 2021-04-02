import { Injectable } from '@nestjs/common';

import { AxiosResponse, AxiosError } from 'axios';
import { HttpRequestsService } from '../core/http-requests/http-requests.service';

@Injectable()
export class TechnologyService {
    constructor(private readonly httpRequestsService: HttpRequestsService) {}

    async createTechnology(title: string) {
        const query = `mutation insert_technology($object: [technology_insert_input!]!) {
                            insert_technology: insert_technology(objects:$object) {
                                returning {
                                    id
                                }
                            }
                        }`;

        const variables = {
            object: {
                title,
            },
        };

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .graphql(query, variables)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }

    async getTechnologiesByTitle(title: string) {
        const query = `query technology($where: technology_bool_exp ) {
                                technology: technology(
                                    where: $where,
                                    order_by: {
                                        title: asc
                                    },
                                    limit: 5
                                ) {
                                    id
                                    title
                                }
                            }`;

        const variables = {
            where: {
                title: {
                    _ilike: title,

                },
            },
        };

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .graphql(query, variables)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }
}
