import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { TeamModule } from '../team/team.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [CoreModule, AuthModule, TeamModule, UserModule],
    controllers: [InvoiceController],
    providers: [InvoiceService],
    exports: [InvoiceService],
})
export class InvoiceModule {}
