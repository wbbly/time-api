import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { CoreModule } from '../core/core.module';
import { ConfigService } from '../core/config/config.service';
import { AuthService } from './auth.service';
import { BearerStrategy } from './bearer.strategy';

@Module({
    imports: [
        CoreModule,
        PassportModule.register({ defaultStrategy: 'bearer' }),
        JwtModule.registerAsync({
            imports: [CoreModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET_KEY'),
                signOptions: {
                    expiresIn: configService.get('JWT_TTL'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [AuthService, BearerStrategy],
    exports: [PassportModule, AuthService],
})
export class AuthModule {}
