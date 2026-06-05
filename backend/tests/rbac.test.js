import request from 'supertest'
import app from '../server.js'
import { clearDatabase, seedUsers, closeDatabaseConnection } from './setup.js'

describe('RBAC Access Control Protection Tests', () => {
  let adminToken, operatorToken, driverToken, watchmanToken, accountantToken

  beforeAll(async () => {
    await clearDatabase()
    await seedUsers()

    // Helper function to login and get token
    const loginAndGetToken = async (username) => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username, password: username })
      return res.body.accessToken
    }

    adminToken = await loginAndGetToken('admin')
    operatorToken = await loginAndGetToken('operator')
    driverToken = await loginAndGetToken('driver')
    watchmanToken = await loginAndGetToken('watchman')
    accountantToken = await loginAndGetToken('accountant')
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  it('should block unauthenticated requests to protected routes with 401', async () => {
    const res = await request(app).get('/api/users')
    expect(res.statusCode).toEqual(401)
  })

  it('should block DRIVER from creating trucks with 403', async () => {
    const res = await request(app)
      .post('/api/trucks')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ registrationNumber: 'A-1234', vehicleType: 'Damper', wheelCount: 14 })

    expect(res.statusCode).toEqual(403)
  })

  it('should block WATCHMAN from verifying payments with 403', async () => {
    const res = await request(app)
      .patch('/api/payments/1/verify')
      .set('Authorization', `Bearer ${watchmanToken}`)

    expect(res.statusCode).toEqual(403)
  })

  it('should block OPERATOR from hitting analytics summary with 403', async () => {
    const res = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${operatorToken}`)

    expect(res.statusCode).toEqual(403)
  })

  it('should block ACCOUNTANT from registering drivers with 403', async () => {
    const res = await request(app)
      .post('/api/drivers')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({ cnic: '42101-1234567-1', licenseNumber: 'AP-1234' })

    expect(res.statusCode).toEqual(403)
  })

  it('should allow SUPER_ADMIN to hit restricted global routes successfully', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.statusCode).toEqual(200)
    expect(res.body.success).toBe(true)
  })
})
