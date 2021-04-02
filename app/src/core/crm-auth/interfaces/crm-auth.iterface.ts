export interface IAuthCrm {
    jsonrpc: string;
    params: {
        login: string;
        password: string;
        db: string;
    };
}


