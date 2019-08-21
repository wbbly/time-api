import { Injectable, HttpService } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AxiosResponse, AxiosError } from 'axios';

import { ConfigService } from '../config/config.service';

@Injectable()
export class HttpRequestsService {
    constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) {}

    request(query: any): Observable<AxiosResponse | AxiosError> {
        return this.httpService
            .post(
                this.configService.get('GRAPHQL_URL'),
                { query },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Hasura-Access-Key': this.configService.get('GRAPHQL_ACCESS_KEY'),
                    },
                }
            )
            .pipe(map(response => response.data));
    }

    requestJiraPost(url: string, query: any, token: string): Observable<AxiosResponse | AxiosError> {
        return this.httpService
            .post(url, query, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${token}`,
                },
            })
            .pipe(map(response => response.data));
    }

    requestJiraGet(url: string, token: string): Observable<AxiosResponse | AxiosError> {
        return this.httpService
            .get(url, {
                headers: {
                    Authorization: `Basic ${token}`,
                },
            })
            .pipe(map(response => response.data));
    }
}
