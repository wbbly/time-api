import { Injectable } from '@nestjs/common';

@Injectable()
export class TimeService {
    constructor() {}

    getISOTime() {
        return new Date().toISOString();
    }

    getUTCTime() {
        return new Date().toUTCString();
    }

    getISOTimeInPast(timeInPast: number) {
        return new Date(new Date().getTime() - timeInPast).toISOString();
    }

    getUTCTimeInPast(timeInPast: number) {
        return new Date(new Date().getTime() - timeInPast).toUTCString();
    }
}
