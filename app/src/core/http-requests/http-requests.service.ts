import { Injectable, HttpService } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConfigService } from '../config/config.service';

@Injectable()
export class HttpRequestsService {
    constructor(private readonly httpService: HttpService, private readonly configService: ConfigService) {}

    request(query: any): Observable<any> {
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
}
