import test from 'japa'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

test.group('User', () => {
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
})
