import { Table, Column, Model, CreatedAt, UpdatedAt, PrimaryKey, ForeignKey, BelongsTo, AllowNull, DataType, HasMany, AutoIncrement } from 'sequelize-typescript';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';

@Table
export class Timer extends Model<Timer> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  startDate: Date;

  @CreatedAt
  @Column
  createdAt: Date;

  @UpdatedAt
  @Column
  updatedAt: Date;

  @AllowNull
  @Column
  endDate: Date;

  @Column({ type: DataType.STRING })
  title: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  timezoneOffset: string;

  @ForeignKey(() => User)
  @PrimaryKey
  @Column
  userId: number;

  @BelongsTo(() => User)
  user;// TODO: add TDO

  @ForeignKey(() => Project)
  @PrimaryKey
  @Column
  projectId: number;

  @BelongsTo(() => Project)
  project;// TODO: add TDO

}
