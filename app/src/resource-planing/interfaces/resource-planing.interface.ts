export interface PlanResource {
    id?: string;
    userId?: string;
    projectId?: string;
    teamId?: string;
    createdById: string;
    totalDuration?: number;
    startDate?: string;
    endDate?: string;
    createdAt?: string;
    modifiedAt?: string;
    userTimeOffId?: string;
}
