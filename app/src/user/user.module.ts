import { Module } from '@nestjs/common';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { userProviders } from './user.providers';
import { DatabaseModule } from '../database/database.module';
import { UserResolver } from './user.resolver';

@Module({
    imports: [DatabaseModule],
    controllers: [UserController],
    providers: [UserService, UserResolver, ...userProviders],
    exports: [UserService],
})
export class UserModule {}
