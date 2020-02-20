import { Injectable } from '@nestjs/common';

import { AxiosResponse, AxiosError } from 'axios';

import { TimerOff } from './interfaces/timer-off.interface';
import { HttpRequestsService } from '../core/http-requests/http-requests.service';

@Injectable()
export class TimerOffService {
    constructor(private readonly httpRequestsService: HttpRequestsService) {}

    async createTimerOff(data: { title: string; teamId: string }): Promise<AxiosResponse | AxiosError> {
        const { title, teamId } = data;

        const query = `mutation {
            insert_timer_off (
                objects: [
                    {
                        title: "${title}",
                        team_id: "${teamId}"
                    }
                ]
            ) {
                returning {
                    id
                    team_id
                    title
                    is_active
                    created_at
                }
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (err: AxiosError) => reject(err));
        });
    }

    async getTimerOffById(id: string): Promise<TimerOff | AxiosError> {
        const query = `{
            timer_off (
                where: {
                    id: {
                        _eq: "${id}"
                    }
                }
            ) {
                id
                team_id
                title
                is_active
                created_at
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe(
                    (res: AxiosResponse) => resolve(res.data.timer_off.shift()),
                    (error: AxiosError) => reject(error)
                );
        });
    }

    async updateTimerOff(
        id: string,
        data: {
            title: string;
            isActive: boolean;
        }
    ): Promise<AxiosResponse | AxiosError> {
        const { title, isActive } = data;

        const query = `mutation {
            update_timer_off (
                where: {
                    id: {_eq: "${id}"}
                },
                _set: {
                    title: "${title}",
                    is_active: ${isActive}
                }
            ) {
                returning {
                    id
                    team_id
                    title
                    is_active
                    created_at
                }
            }
        }`;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe((res: AxiosResponse) => resolve(res), (err: AxiosError) => reject(err));
        });
    }

    async getTimerOffList(teamId: string): Promise<AxiosResponse | AxiosError> {
        const query = `{
            timer_off (
                where: {
                    team_id: {
                        _eq: "${teamId}"
                    }
                },
                order_by: {
                    created_at: asc
                }
            ) {
                id
                team_id
                title
                is_active
                created_at
            }
        }
        `;

        return new Promise(async (resolve, reject) => {
            this.httpRequestsService
                .request(query)
                .subscribe(async (res: AxiosResponse) => resolve(res), (err: AxiosError) => reject(err));
        });
    }
}
