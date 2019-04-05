import { Project } from '../../project/interfaces/project.interface';
import { User } from '../../user/interfaces/user.interface';

export interface TimerCurrentV2 {
    id?: string;
    issue?: string;
    userId?: string;
    projectId?: string;
    startDatetime?: string;
    notification6hrs?: boolean;
    project?: Project;
    user?: User;
}
