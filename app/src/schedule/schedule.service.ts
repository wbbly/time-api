import { Injectable } from '@nestjs/common';
import { Cron, NestSchedule } from 'nest-schedule';

import { MailService } from '../core/mail/mail.service';
import { TimerCurrentV2Service } from '../timer-current-v2/timer-current-v2.service';
import { TimeService } from '../time/time.service';
import { TimerCurrentV2 } from '../timer-current-v2/interfaces/timer-current-v2.interface';
import { InvoiceService } from '../invoice/invoice.service';
import { TimerService } from '../timer/timer.service';
import { TeamService } from '../team/team.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { ProjectService } from '../project/project.service';
import { UserService } from '../user/user.service';
import { AxiosResponse } from 'axios';
import moment from 'moment';

@Injectable()
export class ScheduleService extends NestSchedule {
    constructor(
        private readonly mailService: MailService,
        private readonly timerCurrentV2Service: TimerCurrentV2Service,
        private readonly timeService: TimeService,
        private readonly invoiceService: InvoiceService,
        private readonly timerService: TimerService,
        private readonly teamService: TeamService,
        private readonly userService: UserService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly projectService: ProjectService
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
    /*
    @Cron('02 * * * *') // add owner and admins to all team projects and all user in team to public projects
    async updateUserProject() {
        const { ROLE_OWNER, ROLE_ADMIN, ROLE_INVOICES_MANAGER, ROLE_MEMBER } = this.roleCollaborationService.ROLES_IDS;
        try {
            const teams = ((await this.teamService.getTeamList()) as AxiosResponse).data.team;
            for (let i = 0; i < teams.length; i++) {
                console.log('i: ' + i);

                let teamOwner =
                    ((await this.userService.getUserByRoleInTeam(teams[i].id, ROLE_OWNER)) as AxiosResponse).data.user_team;
                if (!teamOwner.length) { continue; }
                teamOwner = teamOwner[0].user_id;

                let teamAdmins =
                    ((await this.userService.getUserByRoleInTeam(teams[i].id, ROLE_ADMIN)) as AxiosResponse).data.user_team;
                teamAdmins = teamAdmins.map(admin => admin.user_id);

                let teamProjects =
                    ((await this.projectService.getProjectTeam(teams[i].id)) as AxiosResponse).data.project_v2;
                teamProjects = teamProjects.map(project => project.id);

                if (teams[i].id === '00000000-0000-0000-0000-000000000000') {  // if team is Lazy Ants we need to add all team user's to public projects.
                    const anyProject = 'f339b6b6-d044-44f3-8887-684e112f7cfd';
                    const dayOffProject = '8f4da3bf-dc2f-46bb-b168-fa148780693e';
                    const lazyAntsProject = '9b971abf-a396-4a07-be64-258cb5235bdb';
                    const selfLearningProject = 'c9777b9f-8e98-4a32-98d3-60f6d71d6887';
                    const sickLeaveProject = '28179eec-8790-4930-9281-4b6a36a019bc';
                    const vacationProject = '5ce65068-570b-4389-b47d-1b1d3f07da55';

                    const publicProjects = [
                        anyProject,
                        dayOffProject,
                        lazyAntsProject,
                        selfLearningProject,
                        sickLeaveProject,
                        vacationProject,
                    ];

                    let teamInvoiceManagers =
                        ((await this.userService.getUserByRoleInTeam(teams[i].id, ROLE_INVOICES_MANAGER)) as AxiosResponse).data.user_team;
                    teamInvoiceManagers = teamInvoiceManagers.map(manager => manager.user_id);

                    let teamMembers =
                        ((await this.userService.getUserByRoleInTeam(teams[i].id, ROLE_MEMBER)) as AxiosResponse).data.user_team;
                    teamMembers = teamMembers.map(member => member.user_id);

                    for (const publicProject of publicProjects) {
                        if (teamProjects.includes(publicProject)) {
                            await this.projectService.addProjectUserQuery(
                                [publicProject],
                                [...teamInvoiceManagers, ...teamMembers],
                            );
                        }
                    }

                }

                console.log('TEAM: ' + teams[i].name);
                console.log('TEAM_OWNER: ' + JSON.stringify(teamOwner));
                console.log('TEAM_ADMINS: ' + JSON.stringify(teamAdmins));
                console.log('TEAM_PROJECTS: ' + JSON.stringify(teamProjects));

                await this.projectService.addProjectUserQuery(teamProjects, [teamOwner, ...teamAdmins]);
            }
        } catch (e) {
            console.log(e)
        }
    }
*/
}
