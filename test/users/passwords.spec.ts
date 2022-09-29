import { UserFactory } from 'Database/factories'
import Database from '@ioc:Adonis/Lucid/Database'
import test, { group } from 'japa'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

test.group('Password', (group) => {
  test.only('it should send an email with the forgot password instructions', async (assert) => {
    const user = await UserFactory.create()

    await supertest(BASE_URL)
      .post('/forgot-password')
      .send({
        email: user.email,
        resetPasswordUrl: 'url',
      })
      .expect(204)
  })

  //before each test, it begins a new transaction.
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })

  //after each test, it makes a rollback.
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
})
