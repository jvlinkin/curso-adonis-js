import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'

export default class UsersController {
  public async store({ request, response }: HttpContextContract) {
    //request.all() para retornar tudo
    const userPayLoad = request.only(['email', 'username', 'password', 'avatar'])
    const user = await User.create(userPayLoad)
    return response.created({ user })
  }
}
