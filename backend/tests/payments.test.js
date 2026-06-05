import request from 'supertest'
import app from '../server.js'
import { clearDatabase, seedUsers, closeDatabaseConnection } from './setup.js'
import pool from '../db/pool.js'

describe('Payments Ledger Ingestion and Audit API', () => {
  let adminToken, operatorToken, driverToken, accountantToken
  let consignmentId

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
    driverToken = await loginAndGetToken('driver')
    accountantToken = await loginAndGetToken('accountant')

    // Seed an approved driver and truck
    const drv = await pool.query(`
      INSERT INTO drivers (user_id, cnic, license_number, is_approved)
      VALUES (3, '42101-1111111-1', 'AP-11111', true) RETURNING id
    `)
    const trk = await pool.query(`
      INSERT INTO trucks (registration_number, vehicle_type, wheel_count, is_approved)
      VALUES ('LHR-1111', 'Damper', 14, true) RETURNING id
    `)

    // Seed a consignment
    const cons = await pool.query(`
      INSERT INTO consignments (consignment_number, driver_id, truck_id, weight_tons, status)
      VALUES ('CON-9988', $1, $2, 20.0, 'PENDING') RETURNING id
    `, [drv.rows[0].id, trk.rows[0].id])
    consignmentId = cons.rows[0].id
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  describe('POST /api/payments', () => {
    it('should block BANK payments if no receipt image is provided', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${operatorToken}`)
        .field('consignmentId', consignmentId)
        .field('amount', 5000)
        .field('paymentMethod', 'BANK')

      expect(res.statusCode).toEqual(400)
      expect(res.body.message).toContain('Bank payments require uploading a receipt image')
    })

    it('should create BANK payment successfully when receipt image is provided', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${operatorToken}`)
        .field('consignmentId', consignmentId)
        .field('amount', 5000)
        .field('paymentMethod', 'BANK')
        .attach('receiptImage', Buffer.from('fake-pdf-stream'), 'receipt.pdf')

      expect(res.statusCode).toEqual(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toEqual('PENDING')
      expect(res.body.data.receipt_image_url).toBeDefined()
    })

    it('should create CASH payment successfully without requiring receipt image', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${operatorToken}`)
        .field('consignmentId', consignmentId)
        .field('amount', 5000)
        .field('paymentMethod', 'CASH')

      expect(res.statusCode).toEqual(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toEqual('PENDING')
      expect(res.body.data.receipt_image_url).toBeNull()
    })

    it('should reject payment with 400 if amount is missing', async () => {
      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${operatorToken}`)
        .field('consignmentId', consignmentId)
        .field('paymentMethod', 'CASH')

      expect(res.statusCode).toEqual(400)
    })
  })

  describe('PATCH /api/payments/:id/verify', () => {
    it('should allow accountant to verify payment, transition consignment to BILLED, and block double confirms', async () => {
      // 1. Create a cash payment
      const pCreate = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${operatorToken}`)
        .field('consignmentId', consignmentId)
        .field('amount', 5000)
        .field('paymentMethod', 'CASH')

      const paymentId = pCreate.body.data.id

      // 2. DRIVER tries to verify (403 block)
      const drvVerify = await request(app)
        .patch(`/api/payments/${paymentId}/verify`)
        .set('Authorization', `Bearer ${driverToken}`)

      expect(drvVerify.statusCode).toEqual(403)

      // 3. ACCOUNTANT verifies
      const accVerify = await request(app)
        .patch(`/api/payments/${paymentId}/verify`)
        .set('Authorization', `Bearer ${accountantToken}`)

      expect(accVerify.statusCode).toEqual(200)
      expect(accVerify.body.success).toBe(true)
      expect(accVerify.body.data.status).toEqual('VERIFIED')

      // Verify consignment updated to BILLED
      const consCheck = await pool.query('SELECT status FROM consignments WHERE id = $1', [consignmentId])
      expect(consCheck.rows[0].status).toEqual('BILLED')

      // 4. Double verify should be blocked with 400 Already processed
      const doubleVerify = await request(app)
        .patch(`/api/payments/${paymentId}/verify`)
        .set('Authorization', `Bearer ${accountantToken}`)

      expect(doubleVerify.statusCode).toEqual(400)
      expect(doubleVerify.body.message).toContain('Already processed')
    })
  })

  describe('PATCH /api/payments/:id/flag', () => {
    it('should flag payment with notes and reject flag requests without explanatory reason', async () => {
      // Create payment
      const pCreate = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${operatorToken}`)
        .field('consignmentId', consignmentId)
        .field('amount', 5000)
        .field('paymentMethod', 'CASH')

      const paymentId = pCreate.body.data.id

      // Attempt flag without reason (400)
      const badFlag = await request(app)
        .patch(`/api/payments/${paymentId}/flag`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({})

      expect(badFlag.statusCode).toEqual(400)

      // Flag with notes
      const goodFlag = await request(app)
        .patch(`/api/payments/${paymentId}/flag`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({ notes: 'Mismatched banks statement reference' })

      expect(goodFlag.statusCode).toEqual(200)
      expect(goodFlag.body.success).toBe(true)
      expect(goodFlag.body.data.status).toEqual('FLAGGED')
      expect(goodFlag.body.data.notes).toEqual('Mismatched banks statement reference')
    })
  })
})
