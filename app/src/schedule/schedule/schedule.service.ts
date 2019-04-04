import { Injectable } from '@nestjs/common';
import { Cron, NestSchedule } from 'nest-schedule';

import { MailService } from '../../core/mail/mail.service';
import { TimerCurrentV2Service } from '../../timer-current-v2/timer-current-v2.service';
import { TimerCurrentV2 } from '../../timer-current-v2/interfaces/timer-current-v2.interface';

@Injectable()
export class ScheduleService extends NestSchedule {
    constructor(
        private readonly mailService: MailService,
        private readonly timerCurrentV2Service: TimerCurrentV2Service
    ) {
        super();
    }

    @Cron('*/15 * * * *')
    async longTaskNotification() {
        const longTaskDuration = 6 * 60 * 60 * 1000; // 6hrs
        const startDatetime = new Date(new Date().getTime() - longTaskDuration).toISOString().slice(0, -1);

        this.timerCurrentV2Service
            .getTimersCurrentByStartDatetime(startDatetime)
            .then(
                (res: TimerCurrentV2[]) => {
                    for (let index = 0; index < res.length; index++) {
                        const item = res[index];
                        const userEmail = item.user.email;
                        this.mailService.send(
                            userEmail,
                            'Current task goes over the 6h',
                            'Hi! You current task goes over the 6h!'
                        );
                    }
                },
                _ => {}
            )
            .catch(_ => {});
    }
}
