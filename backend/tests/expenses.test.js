import request from 'supertest'
import app from '../server.js'
import { clearDatabase, seedUsers, closeDatabaseConnection } from './setup.js'

describe('Office Expense Outflow Ledgers API', () => {
  let operatorToken, accountantToken

  beforeEach(async () => {
    await clearDatabase()
    await seedUsers()

    const loginAndGetToken = async (username) => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username, password: username })
      return res.body.accessToken
    }

    operatorToken = await loginAndGetToken('operator')
    accountantToken = await loginAndGetToken('accountant')
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  describe('POST /api/expenses', () => {
    it('should create expense successfully as accountant with valid details', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          category: 'SALARY',
          amount: 45000,
          description: 'Watchman Salary June 2026'
        })

      expect(res.statusCode).toEqual(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.category).toEqual('SALARY')
    })

    it('should block OPERATOR from recording expenses with 403', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          category: 'PETTY_CASH',
          amount: 5000
        })

      expect(res.statusCode).toEqual(403)
    })

    it('should fail with 400 when invalid category is passed', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          category: 'LUXURY_CAR',
          amount: 5000000
        })

      expect(res.statusCode).toEqual(400)
    })

    it('should fail with 400 when amount is missing', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          category: 'PETTY_CASH'
        })

      expect(res.statusCode).toEqual(400)
    })
  })

  describe('GET /api/expenses', () => {
    it('should return all recorded ledgers successfully', async () => {
      const res = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${accountantToken}`)

      expect(res.statusCode).toEqual(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('DELETE /api/expenses/:id', () => {
    it('should delete recorded expense successfully', async () => {
      // Create first
      const createRes = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({ category: 'MAINTENANCE', amount: 8000 })

      const expenseId = createRes.body.data.id

      const res = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${accountantToken}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body.success).toBe(true)
    })
  })
})
