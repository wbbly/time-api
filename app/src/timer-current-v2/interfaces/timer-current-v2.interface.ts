import { Project } from '../../project/interfaces/project.interface';
import { User } from '../../user/interfaces/user.interface';
import { Time } from '../../time/interfaces/time.interface';

export interface TimerCurrentV2 {
    id?: string;
    issue?: string;
    userId?: string;
    projectId?: string;
    startDatetime?: string;
    notification6hrs?: boolean;
    project?: Project;
    user?: User;
    time?: Time;
}
