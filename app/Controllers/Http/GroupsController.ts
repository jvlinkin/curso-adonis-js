import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Group from 'App/Models/Group'

export default class GroupsController {
  public async store({ request, response }: HttpContextContract) {
    const groupPayLoad = request.all()
    const group = await Group.create(groupPayLoad)

    return response.created({ group })
  }
}
