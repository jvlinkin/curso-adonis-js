import Mail from '@ioc:Adonis/Addons/Mail'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'

export default class PasswordsController {
  public async forgotPassword({ request, response }: HttpContextContract) {
    const { email, resetPasswordUrl } = request.body()
    const user = await User.findByOrFail('email', email)

    await Mail.send((message) => {
      message
        .from('no-reply@api.com')
        .to(email)
        .subject('API: Recuperação de senha.')
        .htmlView('email/forgotpassword', {
          productName: 'API',
          name: user.username,
          resetPasswordUrl,
        })
    })

    return response.noContent()
  }
}
