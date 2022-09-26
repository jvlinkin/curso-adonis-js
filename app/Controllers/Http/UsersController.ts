import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequest from 'App/Exceptions/BadRequestException'
import User from 'App/Models/User'
import test from 'japa'

export default class UsersController {
  public async store({ request, response }: HttpContextContract) {
    //request.all() para retornar tudo
    const userPayLoad = request.only(['email', 'username', 'password', 'avatar'])

    //findBy, onde todos os campos 'email' sejam iguais ao userPayload.email
    const userByEmail = await User.findBy('email', userPayLoad.email)
    const userByUsername = await User.findBy('username', userPayLoad.username)

    if (userByUsername) {
      throw new BadRequest('username already in use', 409)
    }

    if (userByEmail) {
      throw new BadRequest('email already in use', 409)
    }

    const user = await User.create(userPayLoad)
    return response.created({ user })
  }
}
