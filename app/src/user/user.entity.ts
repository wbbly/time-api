import {
    Table,
    Column,
    Model,
    CreatedAt,
    UpdatedAt,
    PrimaryKey,
    Unique,
    AutoIncrement,
    HasMany,
    BelongsToMany,
    DataType,
    ForeignKey,
    BelongsTo,
    Scopes,
    DefaultScope,
} from 'sequelize-typescript';

import { Project } from '../project/project.entity';
import { Team } from '../team/team.entity';
import { Timer } from '../timer/timer.entity';
import { UserProject } from './user.project.entity';
import { TeamUser } from '../team/team.user.entity';

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
    timers: Timer[]; // TODO: add TDO

    @BelongsToMany(() => Team, () => TeamUser)
    teams: Team[]; // TODO: add TDO

    @BelongsToMany(() => Project, () => UserProject, 'projectId', 'userId')
    projects: Project[]; // TODO: add TDO
}
