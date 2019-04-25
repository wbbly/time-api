import { Controller, Get, Response, HttpStatus, Query } from '@nestjs/common';
import { AxiosError } from 'axios';

import { ReportService } from './report.service';

@Controller('report')
export class ReportController {
    constructor(private readonly reportService: ReportService) {}

    @Get('export')
    async reportExport(@Response() res: any, @Query() params) {
        if (!(params && params.startDate && params.endDate)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameters startDate and endDate are required!' });
        }

        if (params && params.userEmails && Object.prototype.toString.call(params.userEmails) !== '[object Array]') {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameters userEmails needs to be an array!' });
        }

        if (params && params.projectNames && Object.prototype.toString.call(params.projectNames) !== '[object Array]') {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameters projectNames needs to be an array!' });
        }

        try {
            const reportExportRes = await this.reportService.getReportExport(
                params.userEmails || [],
                params.projectNames || [],
                params.startDate,
                params.endDate,
                params.timezoneOffset
            );

            return res.status(HttpStatus.OK).json(reportExportRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response.data.errors);
        }
    }
}
