import Group from './Group'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from './User'

export default class GroupRequest extends BaseModel {
  public static table = 'groups_requests'

  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'user_id' })
  public userId: number

  @column({ columnName: 'group_id' })
  public groupId: number

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  public user: BelongsTo<typeof User>

  @belongsTo(() => Group, {
    foreignKey: 'groupId',
  })
  public group: BelongsTo<typeof Group>

  @column()
  public status: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
