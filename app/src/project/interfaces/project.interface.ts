import { ProjectColor } from '../../project-color/interfaces/project-color.interface';
import { Timer } from '../../timer/interfaces/timer.interface';

export interface Project {
    id?: string;
    name?: string;
    isActive?: boolean;
    projectColorId?: string;
    createdAt?: string;
    projectColor?: ProjectColor;
    timer?: Timer[];
}
