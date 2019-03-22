export interface StoppedTimer {
    userEmail: string;
    issue: string;
    dateFrom: string;
    dateTo: string;
    project: {
        id: number;
        name: string;
        colorProject: string;
    };
}
