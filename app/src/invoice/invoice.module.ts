import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { TeamModule } from '../team/team.module';
import { UserModule } from '../user/user.module';
import { FileService } from '../file/file.service';

@Module({
    imports: [CoreModule, AuthModule, TeamModule, UserModule, FileService],
    controllers: [InvoiceController],
    providers: [InvoiceService, FileService],
    exports: [InvoiceService],
})
export class InvoiceModule {}
