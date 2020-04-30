import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { CoreModule } from '../core/core.module';
import { AuthService } from './auth.service';
import { BearerStrategy } from './bearer.strategy';

@Module({
    imports: [
        CoreModule,
        PassportModule.register({ defaultStrategy: 'bearer' }),
        JwtModule.registerAsync({
            imports: [CoreModule],
            useFactory: async () => ({
                secret: process.env.JWT_SECRET_KEY,
                signOptions: {
                    expiresIn: process.env.JWT_TTL,
                },
                verifyOptions: {
                    clockTolerance: 60,
                    maxAge: process.env.JWT_TTL,
                },
            }),
        }),
    ],
    providers: [AuthService, BearerStrategy],
    exports: [PassportModule, AuthService],
})
export class AuthModule {}
