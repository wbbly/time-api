import { Module, HttpModule } from '@nestjs/common';

import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';

@Module({
    imports: [HttpModule],
    providers: [EventsGateway, EventsService],
})
export class EventsModule {}
