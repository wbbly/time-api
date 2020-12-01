import { Injectable } from '@nestjs/common';

@Injectable()
export class CurrencyService {
    getFormattedValue(amount, currency) {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format(amount);
    }
}
