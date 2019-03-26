import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { User } from './interfaces/user.interface';

@Injectable()
export class UserService {
    private salt = 10;

    constructor(private readonly httpRequestsService: HttpRequestsService) {}

    async getUser(data: { email: string }): Promise<User | null> {
        const { email } = data;

        const query = `{
            user(where: { email: { _eq: "${email}" }, is_active: { _eq: true } }) {
                id
                username
                email
                password
                role {
                    title
                }
            }
        }
        `;

        let user: User = null;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                res => {
                    const data = res.data.user.shift();
                    if (data) {
                        const { id: userId, username, email, password, role } = data;
                        const { id: roleId, title } = role;
                        user = {
                            id: userId,
                            username,
                            email,
                            password,
                            role: {
                                id: roleId,
                                title,
                            },
                        };
                    }

                    resolve(user);
                },
                error => reject(error)
            );
        });
    }

    async checkUserExists(data: { email: string }): Promise<boolean> {
        const { email } = data;

        const query = `{
            user(where: { email: { _eq: "${email}" } }) {
                id
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                res => {
                    const users = res.data.user || [];
                    resolve(users.length > 0);
                },
                error => reject(error)
            );
        });
    }

    async createUser(data: {
        username: string;
        email: string;
        password: string;
        roleId: string;
    }): Promise<User | null> {
        const { username, email, password, roleId } = data;
        const passwordHash = await this.getHash(password);

        const query = `mutation {
            insert_user(
                objects: [
                    {
                        username: "${username}"
                        email: "${email}",
                        password: "${passwordHash}",
                        role_id: "${roleId}"
                    }
                ]
            ){
                affected_rows
            }
        }
        `;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(res => resolve(res), error => reject(error));
        });
    }

    async getHash(password: string | undefined): Promise<string> {
        return bcrypt.hash(password, this.salt);
    }

    async compareHash(password: string | undefined, hash: string | undefined): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
