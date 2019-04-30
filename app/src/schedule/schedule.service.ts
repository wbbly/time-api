import { Injectable } from '@nestjs/common';
import { Cron, NestSchedule } from 'nest-schedule';

import { MailService } from '../core/mail/mail.service';
import { TimerCurrentV2Service } from '../timer-current-v2/timer-current-v2.service';
import { TimeService } from '../time/time.service';
import { TimerCurrentV2 } from '../timer-current-v2/interfaces/timer-current-v2.interface';

@Injectable()
export class ScheduleService extends NestSchedule {
    constructor(
        private readonly mailService: MailService,
        private readonly timerCurrentV2Service: TimerCurrentV2Service,
        private readonly timeService: TimeService
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
                        const userEmail = item.user.email;
                        this.mailService
                            .send(
                                userEmail,
                                'Current task goes over the 6 hours',
                                `Hi! You current task goes over the 6 hours!
                            <br />
                            It will be stop automatically after the time goes out of 8 hours.
                            <br /><br />
                            --
                            <br />
                            Wobbly.me
                            <br />
                            Time Tracking
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
                        const userEmail = item.user.email;

                        this.timerCurrentV2Service._endTimerFlowSubject.next({ userId });
                        this.mailService.send(
                            userEmail,
                            'Current task was stopped automatically after 8 hours!',
                            `Hi! You current task was stopped automatically after 8 hours!
                            <br /><br />
                            --
                            <br />
                            Wobbly.me
                            <br />
                            Time Tracking
                            `
                        );
                    }
                },
                _ => {}
            )
            .catch(_ => {});
    }
}
