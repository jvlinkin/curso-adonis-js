import Database from '@ioc:Adonis/Lucid/Database'
import { UserFactory } from 'Database/factories'
import test from 'japa'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

test.group('User', (group) => {
  test('it should create an user', async (assert) => {
    const userPayLoad = {
      email: 'teste@teste.com',
      username: 'teste',
      password: 'teste',
      avatar: 'https://imagens.com/image.png',
    }

    const { body } = await supertest(BASE_URL).post('/users').send(userPayLoad).expect(201)

    assert.exists(body.user, 'No body.')
    assert.exists(body.user.id, 'ID undefined.')
    assert.equal(body.user.email, userPayLoad.email)
    assert.equal(body.user.username, userPayLoad.username)
    assert.notExists(body.user.password, 'Password defined')
    assert.equal(body.user.avatar, userPayLoad.avatar)
  })

  test('it should return 409 when the email is already used by someone else.', async (assert) => {
    const { email } = await UserFactory.create()

    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email, //email is coming from the factory, that's why is the same, and get 409
        username: 'test',
        password: 'test',
        avatar: 'link.com',
      })
      .expect(409)

    assert.exists(body.message)
    assert.exists(body.code)
    assert.exists(body.status)
    assert.include(body.message, 'email')
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('it should return 409 when the username is already in use by someone else', async (assert) => {
    const { username } = await UserFactory.create()

    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email: 'email@teste.com',
        username, //username is coming from the factory, that's why is the same, and GET 409
        password: 'teste',
        avatar: 'image.com',
      })
      .expect(409)

    assert.exists(body.message)
    assert.exists(body.code)
    assert.exists(body.status)
    assert.include(body.message, 'username') //include verify if contains 'username' on the error.
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('it should return 422 when required data is not provided.', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email: 'teste@teste.com',
        username: 'teste',
        avatar: 'link.com',
        //password: 'password123',
      })
      .expect(422)

    console.log({ body: JSON.stringify(body) })

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
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
