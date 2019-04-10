import { Module, HttpModule } from '@nestjs/common';

import { TimeController } from './time.controller';
import { TimeService } from './time.service';

@Module({
    imports: [HttpModule],
    controllers: [TimeController],
    providers: [TimeService],
})
export class TimeModule {}
