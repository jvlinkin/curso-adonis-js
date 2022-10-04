import Mail from '@ioc:Adonis/Addons/Mail'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import TokenExpiredException from 'App/Exceptions/TokenExpiredException'
import User from 'App/Models/User'
import ForgotPasswordValidator from 'App/Validators/ForgotPasswordValidator'
import ResetPasswordValidator from 'App/Validators/ResetPasswordValidator'
import crypto from 'crypto'
import { DateTime } from 'luxon'

export default class PasswordsController {
  public async forgotPassword({ request, response }: HttpContextContract) {
    const { email, resetPasswordUrl } = await request.validate(ForgotPasswordValidator)

    const user = await User.findByOrFail('email', email)

    const token = crypto.randomBytes(20).toString('hex')

    await user.related('tokens').updateOrCreate({ userId: user.id }, { token })

    const resetPasswordUrlWithToken = `${resetPasswordUrl}?token=${token}`
    await Mail.send((message) => {
      message
        .from('no-reply@api.com')
        .to(email)
        .subject('API: Recuperação de senha.')
        .htmlView('email/forgotpassword', {
          productName: 'API',
          name: user.username,
          resetPasswordUrl: resetPasswordUrlWithToken,
        })
    })

    return response.noContent()
  }

  public async resetPassword({ request, response }: HttpContextContract) {
    const { token, password } = await request.validate(ResetPasswordValidator)

    const findUserByToken = await User.query()
      .whereHas('tokens', (query) => {
        query.where('token', token)
      })
      .preload('tokens')
      .firstOrFail()
    //that's a strategy you can use, but here we are going to follow the course instructions
    //const dateNow = DateTime.now()
    //const tokenHour = await findUserByToken.tokens[0].createdAt

    //if (dateNow > tokenHour) {
    //  throw new Error('Token has expired.')
    //}

    //validating if token hasn't expired yet.
    const tokenAge = Math.abs(findUserByToken.tokens[0].createdAt.diffNow('hours').hours)

    if (tokenAge > 2) {
      throw new TokenExpiredException()
    }

    findUserByToken.password = password
    await findUserByToken.save()
    await findUserByToken.tokens[0].delete()

    return response.noContent()
  }
}
