import { ProjectColor } from '../../project-color/interfaces/project-color.interface';
import { Timer } from '../../timer/interfaces/timer.interface';
import { Team } from '../../team/interfaces/team.interface';

export interface Project {
    id?: string;
    name?: string;
    isActive?: boolean;
    projectColorId?: string;
    team_id?: string;
    slug?: string;
    createdAt?: string;
    projectColor?: ProjectColor;
    timer?: Timer[];
    team?: Team;
    clientId?: string;
    jiraProjectId?: string;
}
