import { Controller, Get, Response, HttpStatus, Query, Headers } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';

import { ReportService } from './report.service';
import { TeamService } from '../team/team.service';

@Controller('report')
export class ReportController {
    constructor(private readonly reportService: ReportService, private readonly teamService: TeamService) {}

    @Get('export')
    async reportExport(@Headers() header: any, @Response() res: any, @Query() params) {
        if (!(header && header['x-user-id'])) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'x-user-id header is required!' });
        }

        if (!(params && params.startDate && params.endDate)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameters startDate and endDate are required!' });
        }

        if (params && params.userEmails && Object.prototype.toString.call(params.userEmails) !== '[object Array]') {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameters userEmails needs to be an array!' });
        }

        if (params && params.projectNames && Object.prototype.toString.call(params.projectNames) !== '[object Array]') {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameters projectNames needs to be an array!' });
        }

        let teamId;
        try {
            const currentTeamRes = await this.teamService.getCurrentTeam(header['x-user-id']);
            teamId = (currentTeamRes as AxiosResponse).data.user_team[0].team.id;
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }

        if (!teamId) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: "The user isn't a member of any team!" });
        }

        try {
            const reportExportRes = await this.reportService.getReportExport(
                teamId,
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
