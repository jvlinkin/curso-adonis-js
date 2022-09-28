import UpdateUserValidator from 'App/Validators/UpdateUserValidator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequest from 'App/Exceptions/BadRequestException'
import User from 'App/Models/User'
import CreateUserValidator from 'App/Validators/CreateUserValidator'

export default class UsersController {
  public async store({ request, response }: HttpContextContract) {
    //request.all() para retornar tudo
    const userPayLoad = await request.validate(CreateUserValidator)
    //verificando dados vindo da request:

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

  public async update({ request, response }: HttpContextContract) {
    //Pegando os dados do corpo da requsição
    //const userPayLoad = request.only(['email, avatar, password'])
    const id = request.param('id')
    const { email, avatar, password } = await request.validate(UpdateUserValidator)

    const user = await User.findOrFail(id)

    user.email = email
    user.password = password

    if (avatar) {
      user.avatar = avatar
    }

    await user.save()

    return response.ok({ user })
  }
}
