import { Injectable } from '@nestjs/common';
import * as humanizeDuration from 'humanize-duration';
import moment from 'moment';

@Injectable()
export class TimeService {
    constructor() {}

    getISOTime(): string {
        return new Date().toISOString();
    }

    getISOTimeWithZeroMilliseconds(): string {
        return new Date().toISOString().replace(/[0-9]{3}Z$/, '000Z');
    }

    getISOTimeByGivenValue(value: string | number): string {
        return new Date(value).toISOString();
    }

    getDateValueFromISOTimeByGivenValue(value: string | number): string {
        return this.getISOTimeByGivenValue(value).split('T')[0];
    }

    getTimeValueFromISOTimeByGivenValue(value: string | number): string {
        return this.getISOTimeByGivenValue(value).split('T')[1];
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

    getTimestampByGivenValue(value: string | number): number {
        return new Date(value).getTime();
    }

    getStartDateOfPrevMonth() {
        const date = new Date();
        date.setDate(0);
        date.setDate(1);

        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }

    getReadableTime(value: string | number, timeInPast: number): string {
        return this.getISOTimeByGivenValue(this.getTimestampByGivenValue(value) - timeInPast)
            .replace('T', ' ')
            .split('.')[0]; // 2019-01-01 00:00:00
    }

    getTimeDurationByGivenTimestamp(number: number): string {
        const shortEnglishHumanizer = humanizeDuration.humanizer({
            language: 'shortEn',
            round: true,
            spacer: '',
            units: ['y', 'mo', 'w', 'd', 'h', 'm', 's'],
            languages: {
                shortEn: {
                    y: () => 'y',
                    mo: () => 'm',
                    w: () => 'w',
                    d: () => 'd',
                    h: () => 'h',
                    m: () => 'm',
                    s: () => 's',
                },
            },
        });

        const duration = shortEnglishHumanizer(number).replace(/,/g, ''); // 2w 2d 45m or 45m 15s

        return duration;
    }

    getDayPeriodsBetweenStartEndDates(startDate: string, endDate: string): any[] {
        let datesList = [];
        let currentDateTimestamp = this.getTimestampByGivenValue(startDate);
        const endDateTimestamp = this.getTimestampByGivenValue(endDate);
        while (currentDateTimestamp < endDateTimestamp) {
            const nextDateTimestamp = this.getTimestampByGivenValue(
                `${this.getDateValueFromISOTimeByGivenValue(
                    currentDateTimestamp + 24 * 60 * 60 * 1000
                )}T${this.getTimeValueFromISOTimeByGivenValue(startDate)}`
            );
            datesList.push({
                startPeriod: this.getISOTimeByGivenValue(currentDateTimestamp),
                endPeriod: this.getISOTimeByGivenValue(
                    nextDateTimestamp > endDateTimestamp ? endDateTimestamp : nextDateTimestamp
                ),
            });
            currentDateTimestamp = nextDateTimestamp;
        }

        return datesList;
    }

    getDonutDateLimited() {
        const donutLimitedDate = moment()
            .set('date', -40)
            .toISOString();

        return donutLimitedDate;
    }
}
