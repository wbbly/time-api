import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from './interfaces/project.interface';

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) {}

    async signIn(data: JwtPayload): Promise<string> {
        return this.jwtService.sign(data);
    }

    async verify(token: string): Promise<JwtPayload> {
        try {
            const decoded = await this.jwtService.verifyAsync(token);

            return decoded;
        } catch (e) {
            console.log(new Date().toISOString(), ' [JWT VERIFY ERROR] ', JSON.stringify(e), ' [TOKEN] ', token);
        }
    }

    async decode(token: string): Promise<null | { [key: string]: any } | string> {
        return this.jwtService.decode(token);
    }

    async getVerifiedUserId(jwt: string): Promise<string | null> {
        try {
            const token = this.getTokenFromJwt(jwt);
            const payload: JwtPayload = await this.verify(token);

            return payload.id;
        } catch (e) {
            return null;
        }
    }

    async getVerifiedUserEmail(jwt: string): Promise<string | null> {
        try {
            const token = this.getTokenFromJwt(jwt);
            const payload: JwtPayload = await this.verify(token);

            return payload.email;
        } catch (e) {
            return null;
        }
    }

    async getDecodedUserId(jwt: string): Promise<string | null> {
        try {
            const token = this.getTokenFromJwt(jwt);
            const payload: null | { [key: string]: any } | string = await this.decode(token);

            if (typeof payload !== 'string') {
                return payload.id || null;
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    async getDecodedUserEmail(jwt: string): Promise<string | null> {
        try {
            const token = this.getTokenFromJwt(jwt);
            const payload: null | { [key: string]: any } | string = await this.decode(token);

            if (typeof payload !== 'string') {
                return payload.email || null;
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    private getTokenFromJwt(jwt: string) {
        return jwt.split(' ')[1];
    }
}
