import Mail from '@ioc:Adonis/Addons/Mail'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class PasswordsController {
  public async forgotPassword({ request, response }: HttpContextContract) {
    const { email } = request.body()
    await Mail.send((message) => {
      message
        .from('no-reply@api.com')
        .to(email)
        .subject('API: Recuperação de senha.')
        .text('Clique no link para redefinir sua senha.')
    })

    return response.noContent()
  }
}
