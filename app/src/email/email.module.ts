import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { EmailController } from './email.controller';

@Module({
    imports: [CoreModule],
    controllers: [EmailController]
})
export class EmailModule {}
