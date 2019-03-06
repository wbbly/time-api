import {
    Table,
    Column,
    Model,
    CreatedAt,
    UpdatedAt,
    PrimaryKey,
    ForeignKey,
    BelongsTo,
    BelongsToMany,
    DataType,
    HasMany,
    AutoIncrement,
} from 'sequelize-typescript';

import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';
import { TeamProject } from './team.project.entity';
import { TeamUser } from './team.user.entity';

@Table
export class Team extends Model<Team> {
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

    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    title: string;

    @BelongsToMany(() => Project, () => TeamProject)
    projects: []; // TODO: add TDO

    @BelongsToMany(() => User, () => TeamUser)
    users: []; // TODO: add TDO
}
