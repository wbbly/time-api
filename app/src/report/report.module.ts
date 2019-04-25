import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { TimeModule } from '../time/time.module';
import { FileModule } from '../file/file.module';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
    imports: [CoreModule, TimeModule, FileModule],
    controllers: [ReportController],
    providers: [ReportService],
})
export class ReportModule {}
