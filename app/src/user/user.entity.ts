import {
    Table,
    Column,
    Model,
    CreatedAt,
    UpdatedAt,
    PrimaryKey,
    AutoIncrement,
    HasMany,
    BelongsToMany,
    DataType,
    BeforeValidate,
} from 'sequelize-typescript';
import * as bcrypt from 'bcryptjs';

import { Project } from '../project/project.entity';
import { Team } from '../team/team.entity';
import { Timer } from '../timer/timer.entity';
import { UserProject } from './user.project.entity';
import { TeamUser } from '../team/team.user.entity';

const ROLE_USER = 'ROLE_USER';
const ROLE_ADMIN = 'ROLE_ADMIN';

@Table({
    timestamps: true,
})
export class User extends Model<User> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @CreatedAt
    @Column
    createdAt: Date;

    @UpdatedAt
    @Column
    updatedAt: Date;

    @Column({ type: DataType.STRING, allowNull: false })
    password: string;

    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    email: string;

    @Column({ type: DataType.STRING, allowNull: false })
    role: string;

    @Column({ type: DataType.STRING })
    fullName: string;

    @HasMany(() => Timer)
    timers: Timer[];

    @BelongsToMany(() => Team, () => TeamUser)
    teams: Team[];

    @BelongsToMany(() => Project, () => UserProject)
    projects: Project[];

    @BeforeValidate
    static async hashPassword(user: User) {
        user.password = await bcrypt.hash(user.password, 10);
    }

    @BeforeValidate
    static async setRole(user: User) {
        if (user.role == null) {
            user.role = ROLE_USER;
        }
    }

    isAdmin() {
        return this.role == ROLE_ADMIN;
    }

    async comparePassword(attempt: string): Promise<boolean> {
        return await bcrypt.compare(attempt, this.password);
    }

    toResponseObject(showToken: boolean = false) {
        const { id, email, role } = this;

        return this;
    }
}
