import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

interface StartedTimer {
    email: string;
    startTime: string;
    title: string;
    project: string;
}

interface StopedTimer {
    email: string;
    startTime: string;
    endTime: string;
    title: string;
    project: string;
}

@WebSocketGateway()
export class EventsGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('join')
    async onRoomJoin(client: Socket, data: { email: string }): Promise<string> {
        const { email } = data;
        client.join(email);

        return 'Join success';
    }

    @SubscribeMessage('leave')
    async onLeaveJoin(client: Socket, data: { email: string }): Promise<string> {
        const { email } = data;
        client.leave(email);

        return 'Leave success';
    }

    @SubscribeMessage('check-timer')
    async checkTimer(client: Socket, data: { email: string }): Promise<string> {
        const { email } = data;

        // @TODO: GET by email request to get startedTimer object on Hashura
        const startedTimer: StartedTimer = {
            email: 'alex.garmatenko@lazy-ants.com',
            startTime: 'Thu, 21 Mar 2019 14:15:49 GMT',
            title: 'Working on the project',
            project: 'Lorem ipsum',
        };

        this.server.in(email).emit('check-timer', startedTimer);

        return 'Check timer';
    }

    @SubscribeMessage('start-timer')
    async startTimer(client: Socket, data: { email: string; title: string; project: string }): Promise<string> {
        const { email } = data;
        const startedTimer: StartedTimer = { ...data, ...{ startTime: new Date().toUTCString() } };

        // @TODO: POST request to save startedTimer object on Hashura

        this.server.in(email).emit('check-timer', startedTimer);

        return 'Start timer';
    }

    @SubscribeMessage('stop-timer')
    async endTimer(client: Socket, data: { email: string }): Promise<string> {
        const { email } = data;

        // @TODO: GET by email request to get startedTimer object on Hashura
        const startedTimer: StartedTimer = {
            email: 'alex.garmatenko@lazy-ants.com',
            startTime: 'Thu, 21 Mar 2019 14:15:49 GMT',
            title: 'Working on the project',
            project: 'Lorem ipsum',
        };

        // Extend with endTime
        const stopedTimer: StopedTimer = {
            ...startedTimer,
            ...{
                endTime: new Date().toUTCString(),
            },
        };

        // @TODO: DELETE request to remove startedTimer object on Hashura
        this.server.in(email).emit('stop-timer', stopedTimer);

        return 'Stop timer';
    }
}
