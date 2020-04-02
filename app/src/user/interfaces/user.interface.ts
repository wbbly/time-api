import { TimerCurrentV2 } from '../../timer-current-v2/interfaces/timer-current-v2.interface';
import { Timer } from '../../timer/interfaces/timer.interface';
import { Social } from '../../social/interfaces/social.interface';
import { Technology } from '../../technology/interfaces/technology.interface';

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
    urlJira?: string;
    typeJira?: string;
    loginJira?: string;
    phone?: string;
    avatar?: string;
    onboardingMobile?: boolean;
    social?: Social[];
    socialId?: string;
    currentTimer?: TimerCurrentV2[];
    timer?: Timer[];
    userTechnologies?: Technology[];
}
