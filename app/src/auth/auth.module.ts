import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from './../user/user.module';
import { AuthResolver } from './auth.resolver';
import { ConfigModule } from 'src/config/config.module';
import { ConfigService } from 'src/config/config.service';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt', session: false }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const options: JwtModuleOptions = {
                    secretOrPrivateKey: configService.jwtSecret,
                };

                options.signOptions = {
                    expiresIn: 600,
                };
                return options;
            },
            inject: [ConfigService],
        }),
        UserModule,
        ConfigModule,
    ],
    providers: [AuthService, JwtStrategy, AuthResolver],
    exports: [],
})
export class AuthModule {}
