import { Inject, Injectable } from '@nestjs/common';

import { ProjectDTO } from './project.dto';
import { Project } from './project.entity';

@Injectable()
export class ProjectService {
    constructor(@Inject('ProjectRepository') private readonly projectRepository: typeof Project) {}

    async findAll(): Promise<Project[]> {
        return await this.projectRepository.findAll<Project>();
    }
}
