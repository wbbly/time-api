import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

import { TimerCurrentV2Service } from './timer-current-v2.service';
import { AuthService } from '../auth/auth.service';
import { TimerCurrentV2 } from './interfaces/timer-current-v2.interface';
import { Timer } from '../timer/interfaces/timer.interface';

@WebSocketGateway()
export class TimerCurrentV2Gateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly timerCurrentV2Service: TimerCurrentV2Service,
        private readonly authService: AuthService
    ) {
        this.timerCurrentV2Service._endTimerFlowSubject.subscribe(({ userId }) => {
            this.endTimerFlow({ userId });
        });
    }

    @SubscribeMessage('join-v2')
    async onRoomJoin(client: Socket, data: { token: string }): Promise<string> {
        const userId = await this.authService.getVerifiedUserId(data.token);
        if (!userId) {
            const decodedUserId = await this.authService.getDecodedUserId(data.token);
            this.server.in(decodedUserId).emit('user-unauthorized', {
                statusCode: 401,
                error: 'Unauthorized',
            });

            return 'Unauthorized';
        }

        client.join(userId);

        return 'Join success';
    }

    @SubscribeMessage('leave-v2')
    async onLeaveJoin(client: Socket, data: { token: string }): Promise<string> {
        const userId = await this.authService.getVerifiedUserId(data.token);
        if (!userId) {
            const decodedUserId = await this.authService.getDecodedUserId(data.token);
            this.server.in(decodedUserId).emit('user-unauthorized', {
                statusCode: 401,
                error: 'Unauthorized',
            });

            return 'Unauthorized';
        }

        client.leave(userId);

        return 'Leave success';
    }

    @SubscribeMessage('check-timer-v2')
    async checkTimer(client: Socket, data: { token: string }): Promise<string> {
        const userId = await this.authService.getVerifiedUserId(data.token);
        if (!userId) {
            const decodedUserId = await this.authService.getDecodedUserId(data.token);
            this.server.in(decodedUserId).emit('user-unauthorized', {
                statusCode: 401,
                error: 'Unauthorized',
            });

            return 'Unauthorized';
        }

        let startedTimer: TimerCurrentV2 = null;
        try {
            startedTimer = await this.timerCurrentV2Service.getTimerCurrent(userId);
        } catch (error) {
            console.log(error);
        }

        if (startedTimer) {
            this.server.in(userId).emit('check-timer-v2', startedTimer);
        } else {
            this.server.in(userId).emit('check-timer-v2', null);
        }

        return 'Check timer';
    }

    @SubscribeMessage('start-timer-v2')
    async startTimer(client: Socket, data: { token: string; issue: string; projectId: string }): Promise<string> {
        const userId = await this.authService.getVerifiedUserId(data.token);
        if (!userId) {
            const decodedUserId = await this.authService.getDecodedUserId(data.token);
            this.server.in(decodedUserId).emit('user-unauthorized', {
                statusCode: 401,
                error: 'Unauthorized',
            });

            return 'Unauthorized';
        }

        let startedTimer: TimerCurrentV2 = null;
        try {
            startedTimer = await this.timerCurrentV2Service.addTimerCurrent({
                userId,
                issue: data.issue,
                projectId: data.projectId,
            });
        } catch (error) {
            console.log(error);
        }

        if (startedTimer) {
            this.server.in(userId).emit('check-timer-v2', startedTimer);
        } else {
            this.server.in(userId).emit('check-timer-v2', null);
        }

        return 'Start timer';
    }

    @SubscribeMessage('update-timer-v2')
    async updateTimer(client: Socket, data: { token: string; issue: string; projectId: string }): Promise<string> {
        const userId = await this.authService.getVerifiedUserId(data.token);
        if (!userId) {
            const decodedUserId = await this.authService.getDecodedUserId(data.token);
            this.server.in(decodedUserId).emit('user-unauthorized', {
                statusCode: 401,
                error: 'Unauthorized',
            });

            return 'Unauthorized';
        }

        let startedTimer: TimerCurrentV2 = null;
        try {
            startedTimer = await this.timerCurrentV2Service.updateTimerCurrent({
                userId,
                issue: data.issue,
                projectId: data.projectId,
            });
        } catch (error) {
            console.log(error);
        }

        if (startedTimer) {
            this.server.in(userId).emit('check-timer-v2', startedTimer);
        } else {
            this.server.in(userId).emit('check-timer-v2', null);
        }

        return 'Start timer';
    }

    @SubscribeMessage('stop-timer-v2')
    async endTimer(client: Socket, data: { token: string }): Promise<string> {
        const userId = await this.authService.getVerifiedUserId(data.token);
        if (!userId) {
            const decodedUserId = await this.authService.getDecodedUserId(data.token);
            this.server.in(decodedUserId).emit('user-unauthorized', {
                statusCode: 401,
                error: 'Unauthorized',
            });

            return 'Unauthorized';
        }

        this.endTimerFlow({ userId });

        return 'Stop timer';
    }

    private async endTimerFlow(data: { userId: string }) {
        const { userId } = data;

        let timer: Timer = null;
        try {
            timer = await this.timerCurrentV2Service.deleteTimerCurrent(userId);
        } catch (error) {
            console.log(error);
        }

        if (timer) {
            this.server.in(userId).emit('stop-timer-v2', timer);
        } else {
            this.server.in(userId).emit('stop-timer-v2', null);
        }
    }
}
