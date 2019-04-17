import { Injectable } from '@nestjs/common';

@Injectable()
export class TimeService {
    constructor() {}

    getISOTime(): string {
        return new Date().toISOString();
    }

    getISOTimeByGivenValue(value: string | number): string {
        return new Date(value).toISOString();
    }

    getUTCTime(): string {
        return new Date().toUTCString();
    }

    getUTCTimeByGivenValue(value: string | number): string {
        return new Date(value).toUTCString();
    }

    getISOTimeInPast(timeInPast: number): string {
        return this.getISOTimeByGivenValue(this.getTimestamp() - timeInPast);
    }

    getUTCTimeInPast(timeInPast: number): string {
        return this.getUTCTimeByGivenValue(this.getTimestamp() - timeInPast);
    }

    getTimestamp(): number {
        return new Date().getTime();
    }

    getTimestampByGivenValue(value: string): number {
        return new Date(value).getTime();
    }
}
