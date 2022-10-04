import { UserFactory } from 'Database/factories'
import Database from '@ioc:Adonis/Lucid/Database'
import test from 'japa'
import supertest from 'supertest'
import Mail from '@ioc:Adonis/Addons/Mail'
import Hash from '@ioc:Adonis/Core/Hash'
import { DateTime, Duration } from 'luxon'

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

  test('it should be able to reset the password', async (assert) => {
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

  //here, we are using the validator on the controller, to validate de data required.
  test('it should return 422 when required data is not provided.', async (assert) => {
    const { body } = await supertest(BASE_URL).post('/reset-password').send({}).expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 404 when using the same token twice.', async (assert) => {
    const user = await UserFactory.create()
    const { token } = await user.related('tokens').create({ token: 'token12345' })

    await supertest(BASE_URL)
      .post('/reset-password')
      .send({
        token,
        password: '123456',
      })
      .expect(204)

    const { body } = await supertest(BASE_URL)
      .post('/reset-password')
      .send({
        token,
        password: '123456',
      })
      .expect(404)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 404)
  })

  test('it cannot reset password when token is expired after 2 hours.', async (assert) => {
    const user = await UserFactory.create()

    const date = DateTime.now().minus(Duration.fromISOTime('02:01')) //cathing 2h and 1minute behind.
    const { token } = await user.related('tokens').create({ token: 'token12345', createdAt: date })

    const { body } = await supertest(BASE_URL)
      .post('/reset-password')
      .send({
        token,
        password: '123456',
      })
      .expect(410)

    console.log(body)

    assert.equal(body.code, 'TOKEN_EXPIRED')
    assert.equal(body.status, 410)
    assert.equal(body.message, 'token has expired')
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
