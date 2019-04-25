import { Injectable } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

import { HttpRequestsService } from '../core/http-requests/http-requests.service';
import { TimeService } from '../time/time.service';
import { FileService } from '../file/file.service';

@Injectable()
export class ReportService {
    constructor(
        private readonly httpRequestsService: HttpRequestsService,
        private readonly timeService: TimeService,
        private readonly fileService: FileService
    ) {}

    getReportExport(
        userEmails: string[],
        projectNames: string[],
        startDate: string,
        endDate: string,
        timezoneOffset?: number
    ): Promise<string | AxiosError> {
        const userWhereStatement = userEmails.length
            ? `user: {email: {_in: [${userEmails.map(userEmail => `"${userEmail}"`).join(',')}]}}`
            : '';

        const projectWhereStatement = projectNames.length
            ? `project: {name: {_in: [${projectNames.map(projectName => `"${projectName}"`).join(',')}]}}`
            : '';

        const timerStatementArray = [`start_datetime: {_gte: "${startDate}"}`, `end_datetime: {_lt: "${endDate}"}`];

        if (userWhereStatement) {
            timerStatementArray.push(userWhereStatement);
        }

        if (projectWhereStatement) {
            timerStatementArray.push(projectWhereStatement);
        }

        const query = `{
            timer_v2(where: {${timerStatementArray.join(',')}}, order_by: {end_datetime: desc}) {
                issue
                start_datetime
                end_datetime
                project {
                    name
                }
                user {
                    email
                    username
                },
            }
        }`;

        return new Promise((resolve, reject) => {
            this.httpRequestsService.request(query).subscribe(
                (res: AxiosResponse) => {
                    const report = this.prepareReport(res.data);
                    const reportPath = this.generateReport(report, timezoneOffset);
                    resolve(reportPath);
                },
                (error: AxiosError) => reject(error)
            );
        });
    }

    private prepareReport(data: any, timezoneOffset?: number): any[] {
        const { timer_v2: timerV2 } = data;
        const timerEntriesReport = {};
        for (let i = 0, timerV2Length = timerV2.length; i < timerV2Length; i++) {
            const timerEntry = timerV2[i];
            const { issue, start_datetime: startDatetime, end_datetime: endDatetime, project, user } = timerEntry;
            const { name: projectName } = project;
            const { email: userEmail, username } = user;

            const uniqueTimeEntryKey = `${issue}-${projectName}-${userEmail}`;
            const previousDuration = timerEntriesReport[uniqueTimeEntryKey]
                ? timerEntriesReport[uniqueTimeEntryKey]['Time']
                : 0;
            const startDate = this.timeService.getTimestampByGivenValue(startDatetime);
            const endDate = timerEntriesReport[uniqueTimeEntryKey]
                ? timerEntriesReport[uniqueTimeEntryKey]['End date']
                : this.timeService.getReadableTime(endDatetime, timezoneOffset);
            const currentDuration =
                this.timeService.getTimestampByGivenValue(endDatetime) -
                this.timeService.getTimestampByGivenValue(startDatetime);
            timerEntriesReport[uniqueTimeEntryKey] = {
                'User name': username.replace(/,/g, ';'),
                'Project name': projectName.replace(/,/g, ';'),
                Issue: issue ? decodeURI(issue).replace(/,/g, ';') : '',
                Time: previousDuration + currentDuration,
                'Start date': startDate,
                'End date': endDate,
            };
        }

        const timerEntriesReportValues = Object.values(timerEntriesReport);
        timerEntriesReportValues.sort((a, b) => a['Start date'] - b['Start date']);
        for (let i = 0, timerEntriesReportLength = timerEntriesReportValues.length; i < timerEntriesReportLength; i++) {
            let timeEntry = timerEntriesReportValues[i];
            timeEntry['Time'] = this.timeService.getTimeDurationByGivenTimestamp(timeEntry['Time']);
            timeEntry['Start date'] = this.timeService.getReadableTime(timeEntry['Start date'], timezoneOffset);
        }

        return timerEntriesReportValues.reverse();
    }

    private generateReport(data: any[], timezoneOffset?: number): string {
        const filePath = this.fileService.saveFile(
            this.fileService.jsonToCsv(data),
            `reports/report_${this.timeService.getReadableTime(this.timeService.getTimestamp(), timezoneOffset)}.csv`
        );

        return filePath;
    }
}
