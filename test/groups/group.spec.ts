import test from 'japa'
import supertest from 'supertest'
import Database from '@ioc:Adonis/Lucid/Database'
import { UserFactory } from 'Database/factories'
import User from 'App/Models/User'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

let token = ''
let user = {} as User

test.group('Group', (group) => {
  test('it should create a group', async (assert) => {
    const user = await UserFactory.create()
    const groupPayLoad = {
      name: 'test',
      description: 'test',
      schedule: 'test',
      location: 'test',
      chronic: 'test',
      master: user.id,
    }
    const { body } = await supertest(BASE_URL)
      .post('/groups')
      .set('Authorization', `Bearer ${token}`)
      .send(groupPayLoad)
      .expect(201)

    assert.exists(body.group, 'Group undefined')
    assert.equal(body.group.name, groupPayLoad.name)
    assert.equal(body.group.description, groupPayLoad.description)
    assert.equal(body.group.schedule, groupPayLoad.schedule)
    assert.equal(body.group.location, groupPayLoad.location)
    assert.equal(body.group.chronic, groupPayLoad.chronic)
    assert.equal(body.group.master, groupPayLoad.master)
    assert.exists(body.group.players, 'Players undefined')
    assert.equal(body.group.players.length, 1)
    assert.equal(body.group.players[0].id, groupPayLoad.master)
  })

  test('it should return 422 when required data is not provided.', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  group.before(async () => {
    const plainPassword = 'teste'
    const newUser = await UserFactory.merge({ password: plainPassword }).create()

    const { body } = await supertest(BASE_URL)
      .post('/sessions')
      .send({
        email: newUser.email,
        password: plainPassword,
      })
      .expect(201)

    token = body.token.token
    user = newUser
  })

  group.after(async () => {
    await supertest(BASE_URL).delete('/sessions').set('Authorization', `Bearer ${token}`)
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
