import BadRequest from 'App/Exceptions/BadRequestException'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GroupRequest from 'App/Models/GroupRequest'
import Group from 'App/Models/Group'

export default class GroupRequestsController {
  public async store({ request, response, auth }: HttpContextContract) {
    const groupId = request.param('groupId') as number
    const userId = auth.user!.id

    const groupRequest = await GroupRequest.create({ groupId, userId })
    await groupRequest.refresh()

    const existingGroupRequest = await GroupRequest.query()
      .where('groupId', groupId)
      .andWhere('userId', userId)
      .first()

    if (existingGroupRequest) {
      throw new BadRequest('group request already exists', 409)
    }

    const userAlreadyInGroup = await Group.query()
      .whereHas('players', (query) => {
        query.where('id', userId)
      })
      .andWhere('id', groupId)
      .first()

    if (userAlreadyInGroup) {
      throw new BadRequest('user is already in the group', 409)
    }

    return response.created({ groupRequest })
  }
}
