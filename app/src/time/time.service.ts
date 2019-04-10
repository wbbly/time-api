import { Injectable } from '@nestjs/common';

@Injectable()
export class TimeService {
    constructor() {}

    getISOTime() {
        return new Date().toISOString();
    }
}
