import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from './interfaces/project.interface';

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) {}

    async signIn(data: JwtPayload): Promise<string> {
        return this.jwtService.sign(data);
    }

    async getUserId(jwt: string): Promise<string | null> {
        try {
            const token = this.getTokenFromJwt(jwt);
            const payload: JwtPayload = await this.jwtService.verify(token);

            return payload.id;
        } catch (e) {
            return null;
        }
    }

    async getUserEmail(jwt: string): Promise<string | null> {
        try {
            const token = this.getTokenFromJwt(jwt);
            const payload: JwtPayload = await this.jwtService.verify(token);

            return payload.email;
        } catch (e) {
            return null;
        }
    }

    private getTokenFromJwt(jwt: string) {
        return jwt.split(' ')[1];
    }
}
