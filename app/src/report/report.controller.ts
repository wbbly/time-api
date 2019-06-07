import {
    Controller,
    Get,
    Response,
    HttpStatus,
    Query,
    Headers,
    UseGuards,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AxiosError, AxiosResponse } from 'axios';

import { ReportService } from './report.service';
import { TeamService } from '../team/team.service';
import { AuthService } from '../auth/auth.service';

@Controller('report')
export class ReportController {
    constructor(
        private readonly reportService: ReportService,
        private readonly teamService: TeamService,
        private readonly authService: AuthService
    ) {}

    @Get('export')
    @UseGuards(AuthGuard())
    async reportExport(@Headers() headers: any, @Response() res: any, @Query() params) {
        const userId = await this.authService.getUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(params.startDate && params.endDate)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameters startDate and endDate are required!' });
        }

        if (params.userEmails && Object.prototype.toString.call(params.userEmails) !== '[object Array]') {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameters userEmails needs to be an array!' });
        }

        if (params.projectNames && Object.prototype.toString.call(params.projectNames) !== '[object Array]') {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'Parameters projectNames needs to be an array!' });
        }

        let teamId;
        try {
            const currentTeamRes = await this.teamService.getCurrentTeam(userId);
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
        } catch (err) {
            const error: AxiosError = err;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }
}
