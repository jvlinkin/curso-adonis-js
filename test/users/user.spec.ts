import Database from '@ioc:Adonis/Lucid/Database'
import { UserFactory } from 'Database/factories'
import test from 'japa'
import supertest from 'supertest'
import Hash from '@ioc:Adonis/Core/Hash'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

test.group('Users', (group) => {
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

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when providing an invalid email.', async (assert) => {
    const { username, avatar, password } = await UserFactory.create()

    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email: 'jkdhsjdhasjda@',
        username,
        avatar,
        password,
      })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when providing an invalid password.', async (assert) => {
    const { username, avatar, email } = await UserFactory.create()

    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email,
        username,
        avatar,
        password: '123',
      })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should update an user.', async (assert) => {
    //Banco de dados Fake
    const { id, password } = await UserFactory.create()

    const email = 'emailteste123@hotmail.com'
    const avatar = 'http://www.imagem.com/avatar323.png'

    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({
        email,
        avatar,
        password,
      })
      .expect(200)

    assert.exists(body.user, 'User undefined')
    assert.equal(body.user.id, id)
    assert.equal(body.user.email, email)
    assert.equal(body.user.avatar, avatar)
  })

  test('it should update the user password', async (assert) => {
    const user = await UserFactory.create()
    const password = 'test'

    const { body } = await supertest(BASE_URL)
      .put(`/users/${user.id}`)
      .send({
        email: user.email,
        avatar: user.avatar,
        password,
      })
      .expect(200)

    assert.exists(body.user, 'User undefined.')
    assert.equal(body.user.id, user.id)

    //HERE, WE NEED DO CALL THE METHOD REFRESH, CAUSE WHEN WE TRY TO VERIFY IF THE PASSWORD IS
    //EQUAL TO THE DATABASE, THE UPDATE IS NOT CONFIRMED YET ON THE DATABASE, AND IT RETURNS FALSE.
    await user.refresh()

    assert.isTrue(await Hash.verify(user.password, password))
  })

  test('it should return 422 when required data is not provided.', async (assert) => {
    const { id } = await UserFactory.create()

    const { body } = await supertest(BASE_URL).put(`/users/${id}`).send({}).expect(422)

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
