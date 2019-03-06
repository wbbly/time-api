import { Table, Column, ForeignKey, BelongsTo, Model, PrimaryKey } from 'sequelize-typescript';

import { Team } from '../team/team.entity';
import { User } from '../user/user.entity';

@Table
export class TeamUser extends Model<TeamUser> {
    @ForeignKey(() => User)
    @PrimaryKey
    @Column
    userId: number;

    @ForeignKey(() => Team)
    @PrimaryKey
    @Column
    teamId: number;
}
