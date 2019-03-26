import { Module, HttpModule } from '@nestjs/common';

import { HttpRequestsService } from './http-requests/http-requests.service';
import { ConfigService } from './config/config.service';

@Module({
    imports: [HttpModule],
    providers: [
        HttpRequestsService,
        {
            provide: ConfigService,
            useValue: new ConfigService('.env'),
        },
    ],
    exports: [HttpRequestsService, ConfigService],
})
export class CoreModule {}
