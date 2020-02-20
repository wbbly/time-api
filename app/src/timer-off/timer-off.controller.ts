import {
    Controller,
    Response,
    HttpStatus,
    Post,
    Body,
    UseGuards,
    Headers,
    UnauthorizedException,
    Patch,
    Param,
    Get,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth/auth.service';
import { TeamService } from '../team/team.service';
import { RoleCollaborationService } from '../role-collaboration/role-collaboration.service';
import { TimerOffService } from './timer-off.service';

@Controller('timer-off')
export class TimerOffController {
    constructor(
        private readonly authService: AuthService,
        private readonly teamService: TeamService,
        private readonly roleCollaborationService: RoleCollaborationService,
        private readonly timerOffService: TimerOffService
    ) {}

    @Post('add')
    @UseGuards(AuthGuard())
    async createTimerOff(@Headers() headers: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!body.title) {
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
                    await this.timerOffService.createTimerOff({
                        title: body.title,
                        teamId,
                    })
                );
            } catch (error) {
                return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.TIMER_OFF.CREATE_TIMER_OFF_FAILED' });
            }
        } else {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    @Patch(':id')
    @UseGuards(AuthGuard())
    async updateTimerOff(@Headers() headers: any, @Param() param: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        let timerOff = null;
        try {
            timerOff = await this.timerOffService.getTimerOffById(param.id);

            if (!timerOff) {
                throw new Error();
            }
        } catch (err) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.TIMER_OFF.EDIT_TIMER_OFF_FAILED' });
        }

        const newTimerOffData: any = {
            title: body.title,
            isActive: body.isActive,
        };

        const timerOffData = {
            title: timerOff.title,
            isActive: timerOff.is_active,
        };

        Object.keys(timerOffData).forEach(prop => {
            const newValue = newTimerOffData[prop];
            timerOffData[prop] = typeof newValue === 'undefined' || newValue === null ? timerOffData[prop] : newValue;
        });

        const currentTeamData: any = await this.teamService.getCurrentTeam(userId);
        const isAdmin =
            currentTeamData.data.user_team[0].role_collaboration_id ===
            this.roleCollaborationService.ROLES_IDS.ROLE_ADMIN;

        if (isAdmin) {
            try {
                return res
                    .status(HttpStatus.OK)
                    .json(await this.timerOffService.updateTimerOff(param.id, timerOffData));
            } catch (err) {
                return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.TIMER_OFF.UPDATE_TIMER_OFF_FAILED' });
            }
        } else {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }

    @Get('list')
    @UseGuards(AuthGuard())
    async getTimerOffList(@Headers() headers: any, @Response() res: any) {
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
                const teamId = currentTeamData.data.user_team[0].team.id;
                const timerOffList = await this.timerOffService.getTimerOffList(teamId);

                return res.status(HttpStatus.OK).json(timerOffList);
            } catch (error) {
                return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.TIMER_OFF.LIST_TIMER_OFF_FAILED' });
            }
        } else {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.USER.NOT.ADMIN' });
        }
    }
}
