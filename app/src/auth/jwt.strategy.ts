import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthenticationError } from 'apollo-server-core';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService, config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.jwtSecret,
        });
    }

    async validate(payload: JwtPayload) {
        // This is called to validate the user in the token exists
        const user = await this.authService.validateJwtPayload(payload);

        if (!user) {
            throw new AuthenticationError('Could not log-in with the provided credentials');
        }

        return user;
    }
}
