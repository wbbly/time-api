import { Table, Column, ForeignKey, BelongsTo, Model, PrimaryKey } from 'sequelize-typescript';
import {Project} from '../project/project.entity';
import {Team} from '../team/team.entity';

@Table
export class TeamProject extends Model<TeamProject> {
  @ForeignKey(() => Team)
  @PrimaryKey
  @Column
  teamId: number;

  @ForeignKey(() => Project)
  @PrimaryKey
  @Column
  projectId: number;
}
