import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CoreModule } from '../core/core.module';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
    imports: [AuthModule, CoreModule],
    controllers: [SubscriptionController],
    providers: [SubscriptionService],
    exports: [SubscriptionService],
})
export class SubscriptionModule {}
