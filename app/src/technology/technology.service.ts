import { Injectable } from '@nestjs/common';

import { AxiosResponse, AxiosError } from 'axios';
import { HttpRequestsService } from '../core/http-requests/http-requests.service';

@Injectable()
export class TechnologyService {
    constructor(private readonly httpRequestsService: HttpRequestsService) {}

    async createTechnology(title: string) {
        const query = `mutation {
                insert_technology(
                    objects: {
                        title: "${title}"
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
    }

    async getTechnology(title: string) {
        const query = `{
            technology(
                where: {
                    title: {
                        _ilike: "%${title}%"
                    }
                }, 
                order_by: {
                    title: asc
                },
                limit: 5
            ) {
                id
                title
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }
}
