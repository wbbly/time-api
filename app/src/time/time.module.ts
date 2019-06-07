import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { TimeController } from './time.controller';
import { TimeService } from './time.service';

@Module({
    imports: [AuthModule],
    controllers: [TimeController],
    providers: [TimeService],
    exports: [TimeService],
})
export class TimeModule {}
