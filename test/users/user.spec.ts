import Database from '@ioc:Adonis/Lucid/Database'
import { UserFactory } from 'Database/factories'
import test from 'japa'
import { Assert } from 'japa/build/src/Assert'
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
        email,
        username: 'test',
        password: 'test',
      })
      .expect(409)

    assert.exists(body.message)
    assert.exists(body.code)
    assert.exists(body.status)
    assert.include(body.message, 'email')
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('it shoud return 409 when the username is already in use by someone else', async (assert) => {
    const { username } = await UserFactory.create()

    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email: 'email@teste.com',
        username: username,
        password: 'teste',
      })
      .expect(409)

    assert.exists(body.message)
    assert.exists(body.code)
    assert.exists(body.status)
    assert.include(body.message, 'username') //include veficica se contém a palavra
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test.only('it should return 422 when required data is not provided.', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email: 'teste@teste.com',
        username: 'teste',
        //needed: password: 'password123'
      })
      .expect(422)
    console.log({ body })

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  //Antes de cada teste, ele inicia uma transaction no BD.
  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })
  //Depois de cada teste, ele faz um rollback no BD, apagando todos os dados do BD.
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
})
