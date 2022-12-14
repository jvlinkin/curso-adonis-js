import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateUserValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    username: schema.string({}, [rules.maxLength(15)]),
    password: schema.string({}, [rules.minLength(4)]),
    email: schema.string({}, [rules.email()]),
    avatar: schema.string({}),
  })

  public messages: CustomMessages = {}
}
