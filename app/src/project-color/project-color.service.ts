import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';

@Injectable()
export class ProjectColorService {
    constructor(private readonly httpRequestsService: HttpRequestsService) {}

    DEFAULT_COLOR_IDS = {
        GREEN: 'a642f337-9082-4f64-8ace-1d0e99fa7258',
    };

    getProjectColorList() {
        const query = `{
            project_color {
                id
                name
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (error: AxiosError) => reject(error));
        });
    }
}
