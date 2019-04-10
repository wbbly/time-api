import { Injectable } from '@nestjs/common';

@Injectable()
export class TimeService {
    constructor() {}

    getISOTime(): string {
        return new Date().toISOString();
    }

    getUTCTime(): string {
        return new Date().toUTCString();
    }

    getISOTimeInPast(timeInPast: number): string {
        return new Date(this.getTimestamp() - timeInPast).toISOString();
    }

    getUTCTimeInPast(timeInPast: number): string {
        return new Date(this.getTimestamp() - timeInPast).toUTCString();
    }

    getTimestamp(): number {
        return new Date().getTime();
    }
}
