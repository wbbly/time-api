import {
    Table,
    Column,
    Model,
    CreatedAt,
    UpdatedAt,
    PrimaryKey,
    ForeignKey,
    BelongsTo,
    HasMany,
    BelongsToMany,
    Unique,
    DataType,
    AutoIncrement,
} from 'sequelize-typescript';

import { User } from '../user/user.entity';
import { Team } from '../team/team.entity';
import { Timer } from '../timer/timer.entity';
import { UserProject } from '../user/user.project.entity';
import { TeamProject } from '../team/team.project.entity';

@Table
export class Project extends Model<Project> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    title: string;

    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    color: string;

    @ForeignKey(() => User)
    @PrimaryKey
    @Column
    creatorId: number;

    @BelongsTo(() => User)
    creator: User;

    @BelongsToMany(() => User, () => UserProject)
    users: []; // TODO: add TDO

    @BelongsToMany(() => Team, () => TeamProject)
    teams: []; // TODO: add TDO

    @CreatedAt
    @Column
    createdAt: Date;

    @UpdatedAt
    @Column
    updatedAt: Date;
}
