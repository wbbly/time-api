import { Table, Column, ForeignKey, BelongsTo, Model, PrimaryKey } from 'sequelize-typescript';

import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';

@Table
export class UserProject extends Model<UserProject> {
    @ForeignKey(() => User)
    @PrimaryKey
    @Column
    userId: number;

    @ForeignKey(() => Project)
    @PrimaryKey
    @Column
    projectId: number;
}
