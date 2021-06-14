import { Injectable, HttpService } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AxiosResponse, AxiosError } from 'axios';

@Injectable()
export class HttpRequestsService {
    constructor(private readonly httpService: HttpService) {}

    request(query: any): Observable<AxiosResponse | AxiosError> {
        return this.httpService
            .post(
                process.env.GRAPHQL_URL,
                { query },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Hasura-Access-Key': process.env.GRAPHQL_ACCESS_KEY,
                    },
                }
            )
            .pipe(map(response => response.data));
    }

    graphql(query: any, variables?: any): Observable<AxiosResponse | AxiosError> {
        return this.httpService
            .post(
                process.env.GRAPHQL_URL,
                { query, variables },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Hasura-Access-Key': process.env.GRAPHQL_ACCESS_KEY,
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
    requestCrmPost(url: string, data: any, cookies: string = ``): Observable<AxiosResponse | AxiosError> {
        return this.httpService
            .post(url, data, {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: cookies,
                },
            })
            .pipe(response => {
                return response;
            });
    }
}
