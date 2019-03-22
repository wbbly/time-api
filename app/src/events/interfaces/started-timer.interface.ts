export interface StartedTimer {
    userEmail: string;
    issue: string;
    dateFrom: string;
    project: {
        id: number;
        name: string;
        colorProject: string;
    };
}
