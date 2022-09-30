import { UserFactory } from 'Database/factories'
import Database from '@ioc:Adonis/Lucid/Database'
import test from 'japa'
import supertest from 'supertest'
import Mail from '@ioc:Adonis/Addons/Mail'
import Hash from '@ioc:Adonis/Core/Hash'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

test.group('Password', (group) => {
  test('it should send an email with the forgot password instructions', async (assert) => {
    const user = await UserFactory.create()

    Mail.trap((message) => {
      assert.deepEqual(message.from, { address: 'no-reply@api.com' })
      assert.deepEqual(message.to, [{ address: user.email }])
      assert.equal(message.subject, 'API: Recuperação de senha.')
      assert.include(message.html!, user.username)
    })

    await supertest(BASE_URL)
      .post('/forgot-password')
      .send({
        email: user.email,
        resetPasswordUrl: 'url',
      })
      .expect(204)

    Mail.restore()
  }).timeout(0)

  test('it should create a reset token', async (assert) => {
    const user = await UserFactory.create()

    await supertest(BASE_URL)
      .post('/forgot-password')
      .send({
        email: user.email,
        resetPasswordUrl: 'url',
      })
      .expect(204)

    const tokens = await user.related('tokens').query()

    assert.isNotEmpty(tokens)
  }).timeout(0)

  test('it should return 422 when required data is not provided, or is invalid.', async (assert) => {
    const { body } = await supertest(BASE_URL).post('/forgot-password').send({}).expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test.only('it should be able to reset the password', async (assert) => {
    const user = await UserFactory.create()
    const { token } = await user.related('tokens').create({ token: 'token12345' })

    await supertest(BASE_URL)
      .post('/reset-password')
      .send({
        token,
        password: '123456',
      })
      .expect(204)

    //HERE, WE NEED DO CALL THE METHOD REFRESH, CAUSE WHEN WE TRY TO VERIFY IF THE PASSWORD IS
    //EQUAL TO THE DATABASE, THE UPDATE IS NOT CONFIRMED YET ON THE DATABASE, AND IT RETURNS FALSE.
    await user.refresh()

    //need to verify if password has changed
    const checkPassword = await Hash.verify(user.password, '123456')
    assert.isTrue(checkPassword)
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
