import request from 'supertest'
import app from '../server.js'
import { clearDatabase, seedUsers, closeDatabaseConnection } from './setup.js'

describe('CEO Analytics Dashboard Reports API', () => {
  let adminToken, operatorToken

  beforeEach(async () => {
    await clearDatabase()
    await seedUsers()

    const loginAndGetToken = async (username) => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username, password: username })
      return res.body.accessToken
    }

    adminToken = await loginAndGetToken('admin')
    operatorToken = await loginAndGetToken('operator')
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  describe('GET /api/analytics/summary', () => {
    it('should return financial summary KPI stats as admin, and block non-admins with 403', async () => {
      // Operator block
      const operatorRes = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${operatorToken}`)

      expect(operatorRes.statusCode).toEqual(403)

      // Admin success
      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.totalConsignments).toBeDefined()
      expect(res.body.data.totalRevenue).toBeDefined()
      expect(res.body.data.pendingReceivables).toBeDefined()
      expect(res.body.data.flaggedPayments).toBeDefined()
      expect(typeof res.body.data.totalRevenue).toEqual('number')
    })
  })

  describe('GET /api/analytics/payments-by-method', () => {
    it('should return payment methods aggregations successfully', async () => {
      const res = await request(app)
        .get('/api/analytics/payments-by-method')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('GET /api/analytics/daily-revenue', () => {
    it('should return last 30 days revenue timeseries successfully', async () => {
      const res = await request(app)
        .get('/api/analytics/daily-revenue')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })
})
