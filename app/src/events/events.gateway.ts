import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

import { EventsService } from './events.service';
import { StartedTimer } from './interfaces/started-timer.interface';
import { StoppedTimer } from './interfaces/stopped-timer.interface';

@WebSocketGateway()
export class EventsGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly eventsService: EventsService) {}

    @SubscribeMessage('join')
    async onRoomJoin(client: Socket, data: { userEmail: string }): Promise<string> {
        const { userEmail } = data;
        client.join(userEmail);

        return 'Join success';
    }

    @SubscribeMessage('leave')
    async onLeaveJoin(client: Socket, data: { userEmail: string }): Promise<string> {
        const { userEmail } = data;
        client.leave(userEmail);

        return 'Leave success';
    }

    @SubscribeMessage('check-timer')
    async checkTimer(client: Socket, data: { userEmail: string }): Promise<string> {
        const { userEmail } = data;
        this.eventsService
            .getTimer(userEmail)
            .subscribe(
                (res: StartedTimer) => this.server.in(userEmail).emit('check-timer', res),
                _ => this.server.in(userEmail).emit('check-timer', null)
            );

        return 'Check timer';
    }

    @SubscribeMessage('start-timer')
    async startTimer(client: Socket, data: { userEmail: string; issue: string; projectId: number }): Promise<string> {
        const { userEmail } = data;
        this.eventsService
            .addTimer(data)
            .subscribe(
                (res: StartedTimer) => this.server.in(userEmail).emit('check-timer', res),
                _ => this.server.in(userEmail).emit('check-timer', null)
            );

        return 'Start timer';
    }

    @SubscribeMessage('update-timer')
    async updateTimer(client: Socket, data: { userEmail: string; issue: string; projectId: number }): Promise<string> {
        const { userEmail } = data;
        this.eventsService
            .updateTimer(data)
            .subscribe(
                (res: StartedTimer) => this.server.in(userEmail).emit('check-timer', res),
                _ => this.server.in(userEmail).emit('check-timer', null)
            );

        return 'Start timer';
    }

    @SubscribeMessage('stop-timer')
    async endTimer(client: Socket, data: { userEmail: string }): Promise<string> {
        const { userEmail } = data;
        this.eventsService
            .deleteTimer(userEmail)
            .subscribe(
                (res: StoppedTimer) => this.server.in(userEmail).emit('stop-timer', res),
                _ => this.server.in(userEmail).emit('stop-timer', null)
            );

        return 'Stop timer';
    }
}
