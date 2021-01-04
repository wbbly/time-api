import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { TeamModule } from '../team/team.module';
import { UserService } from '../user/user.service';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

@Module({
    controllers: [PaymentController],
    imports: [CoreModule, UserModule, AuthModule, TeamModule],
    providers: [PaymentService, UserService],
    exports: [PaymentService],
})
export class PaymentModule {}
