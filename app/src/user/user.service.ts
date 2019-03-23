import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';

import { UserDTO } from './user.dto';
import { User } from './user.entity';
import { Timer } from '../timer/timer.entity';
import { Team } from '../team/team.entity';
import { Project } from '../project/project.entity';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
    constructor(@Inject('UserRepository') private readonly userRepository: typeof User) {}

    async findAll(): Promise<User[]> {
        let user = await this.userRepository.findAll<User>({
            include: [Timer, Team, Project],
        });

        console.log(user);

        return user;
    }

    async findByEmail(email: string): Promise<User> {
        return await this.userRepository.findOne({ where: { email } });
    }

    async login(data: UserDTO) {
        const { email, password } = data;

        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new HttpException('Invalit credentials', HttpStatus.BAD_REQUEST);
        }

        if (!(await user.comparePassword(password))) {
            throw new HttpException('Invalit credentials data', HttpStatus.BAD_REQUEST);
        }

        return user;
    }

    async register(data: UserDTO) {
        const { email } = data;

        let user = await this.userRepository.findOne({ where: { email } });

        if (user) {
            throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
        }
        user = await this.userRepository.create(data);

        return user.toResponseObject(true);
    }
}
