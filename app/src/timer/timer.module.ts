import { forwardRef, Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { TimeModule } from '../time/time.module';
import { TeamModule } from '../team/team.module';
import { TimerController } from './timer.controller';
import { TimerService } from './timer.service';
import { PaymentModule } from '../payment/payment.module';
import { UserModule } from '../user/user.module';
import { ProjectModule } from '../project/project.module';

@Module({
    imports: [CoreModule, AuthModule, TimeModule, TeamModule, PaymentModule, UserModule, forwardRef(() => ProjectModule)],
    controllers: [TimerController],
    providers: [TimerService],
    exports: [TimerService],
})
export class TimerModule {}
