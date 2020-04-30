import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import {CoreModule} from '../core/core.module';
import {PaymentService} from './payment.service';

@Module({
    controllers: [PaymentController],
    imports: [CoreModule],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule {}
