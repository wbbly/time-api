import { SyncItem } from './sync.item.iterface';

export interface Sync {
    getProjects(url: string, token: string): Promise<any>;
}
