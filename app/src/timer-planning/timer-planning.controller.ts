import {
    Controller,
    Response,
    HttpStatus,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    Headers,
    UnauthorizedException,
    Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from '../auth/auth.service';
import { TeamService } from '../team/team.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { TimerPlanningService } from './timer-planning.service';

@Controller('timer-planning')
export class TimerPlanningController {
    constructor(
        private readonly authService: AuthService,
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly timerPlanningService: TimerPlanningService
    ) {}

    @Post('add')
    @UseGuards(AuthGuard())
    async createTimerPlanning(@Headers() headers: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(body.userId && (body.projectId || body.timerOffId) && body.duration && body.startDate && body.endDate)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            try {
                const teamId = currentTeamData.data.user_team[0].team.id;

                return res.status(HttpStatus.OK).json(
                    await this.timerPlanningService.createTimerPlanning({
                        teamId,
                        userId: body.userId,
                        projectId: body.projectId,
                        timerOffId: body.timerOffId,
                        duration: body.duration,
                        startDate: body.startDate,
                        endDate: body.endDate,
                        createdById: userId,
                    })
                );
            } catch (error) {
                return res
                    .status(HttpStatus.BAD_REQUEST)
                    .json({ message: 'ERROR.TIMER_PLANNING.CREATE_TIMER_PLANNING_FAILED' });
            }
        } else {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    @Patch(':id')
    @UseGuards(AuthGuard())
    async updateTimerPlanning(@Headers() headers: any, @Param() param: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        let timerPlanning = null;
        try {
            timerPlanning = await this.timerPlanningService.getTimerPlanningById(param.id);

            if (!timerPlanning) {
                throw new Error();
            }
        } catch (err) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json({ message: 'ERROR.TIMER_PLANNING.UPDATE_TIMER_PLANNING_FAILED' });
        }

        const newTimerPlanningData: any = {
            userId: body.userId,
            projectId: body.projectId,
            timerOffId: body.timerOffId,
            duration: body.duration,
            startDate: body.startDate,
            endDate: body.endDate,
        };

        const timerPlanningData = {
            userId: timerPlanning.user_id,
            projectId: timerPlanning.project_id,
            timerOffId: timerPlanning.timer_off_id,
            duration: timerPlanning.duration,
            startDate: timerPlanning.start_date,
            endDate: timerPlanning.end_date,
        };

        Object.keys(timerPlanningData).forEach(prop => {
            const newValue = newTimerPlanningData[prop];
            timerPlanningData[prop] =
                typeof newValue === 'undefined' || newValue === null ? timerPlanningData[prop] : newValue;
        });

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            try {
                return res
                    .status(HttpStatus.OK)
                    .json(await this.timerPlanningService.updateTimerPlanning(param.id, timerPlanningData));
            } catch (err) {
                return res
                    .status(HttpStatus.FORBIDDEN)
                    .json({ message: 'ERROR.TIMER_PLANNING.UPDATE_TIMER_PLANNING_FAILED' });
            }
        } else {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    @Post('list')
    @UseGuards(AuthGuard())
    async getTimerPlanningsList(@Headers() headers: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(body.userIds && body.startDate && body.endDate)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        const timerOffIds = body.timerOffIds || [];

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            try {
                const teamId = currentTeamData.data.user_team[0].team.id;

                return res
                    .status(HttpStatus.OK)
                    .json(
                        await this.timerPlanningService.getTimerPlanningList(
                            teamId,
                            timerOffIds,
                            body.userIds,
                            body.startDate,
                            body.endDate
                        )
                    );
            } catch (error) {
                return res
                    .status(HttpStatus.FORBIDDEN)
                    .json({ message: 'ERROR.TIMER_PLANNING.GET_TIMER_PLANNING_LIST_FAILED' });
            }
        } else {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    @Post('list/:userId')
    @UseGuards(AuthGuard())
    async getTimerPlanningsFullList(
        @Headers() headers: any,
        @Response() res: any,
        @Param() param: any,
        @Body() body: any
    ) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!(body.startDate && body.endDate)) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        const timerOffIds = body.timerOffIds || [];

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            try {
                const teamId = currentTeamData.data.user_team[0].team.id;

                return res
                    .status(HttpStatus.OK)
                    .json(
                        await this.timerPlanningService.getTimerPlanningListByUserId(
                            teamId,
                            timerOffIds,
                            param.userId,
                            body.startDate,
                            body.endDate
                        )
                    );
            } catch (error) {
                return res
                    .status(HttpStatus.FORBIDDEN)
                    .json({ message: 'ERROR.TIMER_PLANNING.GET_TIMER_PLANNING_BY_USER_FAILED' });
            }
        } else {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    @Delete(':id')
    @UseGuards(AuthGuard())
    async deleteTimerPlanning(@Headers() headers: any, @Response() res: any, @Param() param: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            try {
                return res
                    .status(HttpStatus.OK)
                    .json(await this.timerPlanningService.deleteTimerPlanningById(param.id));
            } catch (error) {
                return res
                    .status(HttpStatus.FORBIDDEN)
                    .json({ message: 'ERROR.TIMER_PLANNING.DELETE_TIMER_PLANNING_FAILED' });
            }
        } else {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }
}
