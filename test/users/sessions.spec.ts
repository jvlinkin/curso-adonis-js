import Database from '@ioc:Adonis/Lucid/Database'
import test from 'japa'
import supertest from 'supertest'
import { UserFactory } from 'Database/factories'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

test.group('Password', (group) => {
  test('it should authenticate an user', async (assert) => {
    const plainPassword = 'test'
    const { id, email } = await UserFactory.merge({ password: plainPassword }).create()
    const { body } = await supertest(BASE_URL)
      .post('/sessions')
      .send({ email, password: plainPassword })
      .expect(201)

    assert.isDefined(body.user, 'User undefined.')
    assert.equal(body.user.id, id)
  })

  test('it should return an api token when session is created.', async (assert) => {
    const plainPassword = 'test'
    const { id, email } = await UserFactory.merge({ password: plainPassword }).create()
    const { body } = await supertest(BASE_URL)
      .post('/sessions')
      .send({ email, password: plainPassword })
      .expect(201)

    assert.isDefined(body.token, 'Token undefined.')
    assert.equal(body.user.id, id)
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
