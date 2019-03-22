export interface StoppedTimer {
    userEmail: string;
    issue: string;
    dateFrom: string;
    dateTo: string;
    project: {
        name: string;
        colorProject: string;
    };
}
