import { Component, Inject, Injectable } from '@nestjs/common';
import { UserDTO } from './user.dto';
import { User } from './user.entity';
import { Timer } from 'src/timer/timer.entity';
import { UserProject } from './user.project.entity';
import { Team } from 'src/team/team.entity';
import { Project } from 'src/project/project.entity';


@Injectable()
export class UserService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: typeof User) { }

  async findAll(): Promise<User[]> {
    let user = await this.userRepository.findAll<User>({
      include: [Timer, Team, Project]
    })
    console.log(user);
    return user;
    // return user.projects.forEach(player => console.log(`Player ${player.name}`));

  }
}
