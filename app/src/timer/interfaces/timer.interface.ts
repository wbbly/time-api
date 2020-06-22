import { Project } from '../../project/interfaces/project.interface';
import { User } from '../../user/interfaces/user.interface';

export interface Timer {
    id?: string;
    issue?: string;
    userId?: string;
    projectId?: string;
    startDatetime?: string;
    endDatetime?: string;
    syncJiraStatus?: boolean;
    jiraWorklogId?: number;
    createdAt?: string;
    project?: Project;
    user?: User;
}
