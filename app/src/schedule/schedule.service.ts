import { Injectable } from '@nestjs/common';
import { Cron, NestSchedule } from 'nest-schedule';

import { MailService } from '../core/mail/mail.service';
import { TimerCurrentV2Service } from '../timer-current-v2/timer-current-v2.service';
import { TimeService } from '../time/time.service';
import { TimerCurrentV2 } from '../timer-current-v2/interfaces/timer-current-v2.interface';
import { InvoiceService } from '../invoice/invoice.service';
import { TimerService } from '../timer/timer.service';
import moment from 'moment';
import { TeamService } from '../team/team.service';

@Injectable()
export class ScheduleService extends NestSchedule {
    constructor(
        private readonly mailService: MailService,
        private readonly timerCurrentV2Service: TimerCurrentV2Service,
        private readonly timeService: TimeService,
        private readonly invoiceService: InvoiceService,
        private readonly timerService: TimerService,
        private readonly teamService: TeamService
    ) {
        super();
    }

    @Cron('*/15 * * * *')
    async longTaskNotification() {
        const longTaskDuration = 6 * 60 * 60 * 1000; // 6hrs
        const startDatetime = this.timeService.getISOTimeInPast(longTaskDuration).slice(0, -1);

        this.timerCurrentV2Service
            .getTimersCurrentNotification6hrs(startDatetime)
            .then(
                (res: TimerCurrentV2[]) => {
                    for (let index = 0; index < res.length; index++) {
                        const item = res[index];
                        const userId = item.user.id;
                        const userEmail = this.mailService.emailStandardize(item.user.email);
                        this.mailService
                            .send(
                                userEmail,
                                'Current task goes over the 6 hours',
                                `Hi! Your current task goes over the 6 hours!
                            <br />
                            It will be stop automatically after the time goes out of 8 hours.
                            <br /><br />
                            --
                            <br /><br />
                            <a href="${process.env.APP_URL}">Wobbly</a>
                            <br />
                            © 2020 All rights reserved.
                            `
                            )
                            .then(res => {
                                this.timerCurrentV2Service.updateTimerCurrentNotification6hrs({
                                    userId,
                                    notification6hrs: true,
                                });
                            })
                            .catch(err => {
                                console.log(err);
                            });
                    }
                },
                _ => {}
            )
            .catch(_ => {});
    }

    @Cron('* * * * *')
    async autostopTask() {
        const autostopTaskDuration = 8 * 60 * 60 * 1000; // 8hrs
        const startDatetime = this.timeService.getISOTimeInPast(autostopTaskDuration).slice(0, -1);

        this.timerCurrentV2Service
            .getTimersCurrentByStartDatetime(startDatetime)
            .then(
                (res: TimerCurrentV2[]) => {
                    for (let index = 0; index < res.length; index++) {
                        const item = res[index];
                        const userId = item.user.id;
                        const userEmail = this.mailService.emailStandardize(item.user.email);

                        this.timerCurrentV2Service._endTimerFlowSubject.next({ userId });
                        this.mailService.send(
                            userEmail,
                            'Current task was stopped automatically after 8 hours!',
                            `Hi! Your current task was stopped automatically after 8 hours!
                            <br /><br />
                            --
                            <br /><br />
                            <a href="${process.env.APP_URL}">Wobbly</a>
                            <br />
                            © 2020 All rights reserved.
                            `
                        );
                    }
                },
                _ => {}
            )
            .catch(_ => {});
    }

    @Cron('* 10 * * * *') // every hour, at the start of the 10th minute
    async updateOverdueStatus(): Promise<void> {
        try {
            await this.invoiceService.updateAllInvoicesOverdueStatus();
        } catch (err) {
            console.log(err);
        }
    }

    @Cron('0 0 * * *') // check every day at midnight for empty title field in timer_v2 table and write decoded issue field to it
    async checkForEmptyTimerTitle() {
        try {
            const timers = await this.timerService.getTimersWithoutTitle();
            for (const timer of timers) {
                await this.timerService.setTimerTitleFromIssue(timer.id, decodeURI(timer.issue));
            }
        } catch (error) {
            console.log(error);
        }
    }

    // @Cron('00 00 * * *') // update invoice due_date, based on timezone_offset
    // async updateInvoiceDueDate() {
    //     try {
    //         const invoices = await this.invoiceService.getInvoicesDueDate();
    //         for (let i = 0; i < invoices.length; i++) {
    //             console.log('UPDATE INVOICE DUE DATE CRON', 'INVOICES AMOUNT', invoices.length, 'INVOICE INDEX', i, 'INVOICE ID', invoices[i].id);
    //             const due_date = moment(invoices[i].due_date)
    //                 .utc()
    //                 .add(invoices[i].timezone_offset, 'milliseconds')
    //                 .add({hours:23,minutes:59,seconds:59})
    //                 .toISOString();
    //             await this.invoiceService.setInvoicesDueDate(invoices[i].id, due_date);
    //         }
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }

    // @Cron('00 00 * * *') // update user_team role_collaboration, based on owner_id
    // async updateUserRole() {
    //     try {
    //         const teams = await this.teamService.getTeamsOwnersInfo();
    //         for (let i = 0; i < teams.length; i++) {
    //             console.log('UPDATE USER ROLE CRON', 'TEAMS AMOUNT', teams.length, 'TEAM INDEX', i, 'TEAM ID', teams[i].id, 'TEAM OWNER_ID', teams[i].owner_id);
    //             const roleId = '00000000-0000-0000-0000-000000000002';
    //
    //             await this.teamService.setUserRole(teams[i].id, teams[i].owner_id, roleId);
    //         }
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }
}
