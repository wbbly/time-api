import { TimerCurrentV2 } from '../../timer-current-v2/interfaces/timer-current-v2.interface';
import { Timer } from '../../timer/interfaces/timer.interface';

export interface User {
    id?: string;
    username?: string;
    email?: string;
    password?: string;
    isActive?: boolean;
    roleId?: string;
    createdAt?: string;
    timezoneOffset?: number;
    resetPasswordHash?: string;
    language?: string;
    tokenJira?: string;
    phone?: string;
    avatar?: string;
    currentTimer?: TimerCurrentV2[];
    timer?: Timer[];
}
