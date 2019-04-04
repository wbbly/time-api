import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

import { TimerCurrentV2Service } from './timer-current-v2.service';
import { TimerCurrentV2 } from './interfaces/timer-current-v2.interface';
import { Timer } from '../timer/interfaces/timer.interface';

@WebSocketGateway()
export class TimerCurrentV2Gateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly timerCurrentV2Service: TimerCurrentV2Service) {
        this.timerCurrentV2Service._endTimerFlowSubject.subscribe(({ userId }) => {
            this.endTimerFlow({ userId });
        });
    }

    @SubscribeMessage('join-v2')
    async onRoomJoin(client: Socket, data: { userId: string }): Promise<string> {
        const { userId } = data;
        client.join(userId);

        return 'Join success';
    }

    @SubscribeMessage('leave-v2')
    async onLeaveJoin(client: Socket, data: { userId: string }): Promise<string> {
        const { userId } = data;
        client.leave(userId);

        return 'Leave success';
    }

    @SubscribeMessage('check-timer-v2')
    async checkTimer(client: Socket, data: { userId: string }): Promise<string> {
        const { userId } = data;

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
    async startTimer(client: Socket, data: { userId: string; issue: string; projectId: string }): Promise<string> {
        const { userId } = data;

        let startedTimer: TimerCurrentV2 = null;
        try {
            startedTimer = await this.timerCurrentV2Service.addTimerCurrent(data);
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
    async updateTimer(client: Socket, data: { userId: string; issue: string; projectId: string }): Promise<string> {
        const { userId } = data;

        let startedTimer: TimerCurrentV2 = null;
        try {
            startedTimer = await this.timerCurrentV2Service.updateTimerCurrent(data);
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
    async endTimer(client: Socket, data: { userId: string }): Promise<string> {
        this.endTimerFlow(data);

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
