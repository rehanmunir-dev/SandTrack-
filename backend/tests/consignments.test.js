import request from 'supertest'
import app from '../server.js'
import { clearDatabase, seedUsers, closeDatabaseConnection } from './setup.js'
import pool from '../db/pool.js'

describe('Consignment Dispatches & QR Exit Gateway Verification API', () => {
  let adminToken, operatorToken, driverToken, otherDriverToken
  let approvedDriverId, approvedTruckId, unapprovedDriverId, unapprovedTruckId
  let driverUserId, otherDriverUserId

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

    // Seed another driver to test listing restriction
    await pool.query(`
      INSERT INTO users (username, password_hash, role, full_name, phone, is_active)
      VALUES ('driver2', 'hash', 'DRIVER', 'Second Driver', '+923002222222', true)
    `)
    otherDriverToken = await loginAndGetToken('driver2')

    const userRows = await pool.query("SELECT id, username FROM users WHERE username IN ('driver', 'driver2')")
    driverUserId = userRows.rows.find(r => r.username === 'driver').id
    otherDriverUserId = userRows.rows.find(r => r.username === 'driver2').id

    // Create approved and pending drivers/trucks
    const drv1 = await pool.query(`
      INSERT INTO drivers (user_id, cnic, license_number, is_approved)
      VALUES ($1, '42101-1111111-1', 'AP-11111', true) RETURNING id
    `, [driverUserId])
    approvedDriverId = drv1.rows[0].id

    const drv2 = await pool.query(`
      INSERT INTO drivers (user_id, cnic, license_number, is_approved)
      VALUES ($1, '42101-2222222-2', 'AP-22222', false) RETURNING id
    `, [otherDriverUserId])
    unapprovedDriverId = drv2.rows[0].id

    const trk1 = await pool.query(`
      INSERT INTO trucks (registration_number, vehicle_type, wheel_count, is_approved)
      VALUES ('LHR-1111', 'Damper', 14, true) RETURNING id
    `)
    approvedTruckId = trk1.rows[0].id

    const trk2 = await pool.query(`
      INSERT INTO trucks (registration_number, vehicle_type, wheel_count, is_approved)
      VALUES ('LHR-2222', 'Suzuki', 8, false) RETURNING id
    `)
    unapprovedTruckId = trk2.rows[0].id
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  describe('POST /api/consignments', () => {
    it('should allow creation when using a pending driver', async () => {
      const res = await request(app)
        .post('/api/consignments')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          driverId: unapprovedDriverId,
          truckId: approvedTruckId,
          weightTons: 25.5
        })

      expect(res.statusCode).toEqual(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.driver_id).toEqual(unapprovedDriverId)
    })

    it('should allow creation when using a pending truck', async () => {
      const res = await request(app)
        .post('/api/consignments')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          driverId: approvedDriverId,
          truckId: unapprovedTruckId,
          weightTons: 25.5
        })

      expect(res.statusCode).toEqual(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.truck_id).toEqual(unapprovedTruckId)
    })

    it('should create consignment successfully when driver and truck exist', async () => {
      const res = await request(app)
        .post('/api/consignments')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          driverId: approvedDriverId,
          truckId: approvedTruckId,
          weightTons: 25.5,
          materialType: 'Sand',
          originLocation: 'Main Terminal',
          destination: 'Saddar Sector'
        })

      expect(res.statusCode).toEqual(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toEqual('SCAN_PENDING')
      expect(res.body.data.consignment_number).toBeDefined()
    })
  })

  describe('PATCH /api/consignments/:id/status', () => {
    it('should allow valid transition from SCAN_PENDING to IN_TRANSIT', async () => {
      const createRes = await request(app)
        .post('/api/consignments')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ driverId: approvedDriverId, truckId: approvedTruckId, weightTons: 25.5 })

      const consignmentId = createRes.body.data.id

      const res = await request(app)
        .patch(`/api/consignments/${consignmentId}/status`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'IN_TRANSIT' })

      expect(res.statusCode).toEqual(200)
      expect(res.body.data.status).toEqual('IN_TRANSIT')
    })

    it('should reject invalid skip transitions (SCAN_PENDING to DELIVERED) with 400', async () => {
      const createRes = await request(app)
        .post('/api/consignments')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ driverId: approvedDriverId, truckId: approvedTruckId, weightTons: 25.5 })

      const consignmentId = createRes.body.data.id

      const res = await request(app)
        .patch(`/api/consignments/${consignmentId}/status`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'DELIVERED' })

      expect(res.statusCode).toEqual(400)
      expect(res.body.success).toBe(false)
    })
  })

  describe('POST /api/consignments/:id/qr', () => {
    it('should generate transient secure QR and save token with 5 minutes expiry', async () => {
      const createRes = await request(app)
        .post('/api/consignments')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ driverId: approvedDriverId, truckId: approvedTruckId, weightTons: 25.5 })

      const consignmentId = createRes.body.data.id

      const res = await request(app)
        .post(`/api/consignments/${consignmentId}/qr`)
        .set('Authorization', `Bearer ${operatorToken}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.qrImage).toBeDefined()
      expect(res.body.data.sessionUrl).toBeDefined()
      expect(res.body.data.expiresAt).toBeDefined()

      // Verify expiresAt is roughly 5 minutes ahead
      const diffMs = new Date(res.body.data.expiresAt) - new Date()
      expect(diffMs).toBeGreaterThan(4 * 60 * 1000)
      expect(diffMs).toBeLessThan(6 * 60 * 1000)
    })
  })

  describe('GET /api/consignments/verify-qr/:token', () => {
    let watchmanToken

    beforeEach(async () => {
      const loginAndGetToken = async (username) => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ username, password: username })
        return res.body.accessToken
      }
      watchmanToken = await loginAndGetToken('watchman')
    })

    it('should verify scanned QR on IN_TRANSIT consignment and clear gate', async () => {
      const createRes = await request(app)
        .post('/api/consignments')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ driverId: approvedDriverId, truckId: approvedTruckId, weightTons: 25.5 })

      const consignmentId = createRes.body.data.id

      // Generate QR (sets status to IN_TRANSIT and saves token)
      const qrRes = await request(app)
        .post(`/api/consignments/${consignmentId}/qr`)
        .set('Authorization', `Bearer ${operatorToken}`)

      const token = qrRes.body.data.consignment.qr_token

      const res = await request(app)
        .get(`/api/consignments/verify-qr/${token}`)
        .set('Authorization', `Bearer ${watchmanToken}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body.success).toBe(true)
      expect(res.body.valid).toBe(true)
      expect(res.body.data.status).toEqual('GATE_CLEARED')

      // Verify token has been deleted from consignment (prevent re-use)
      const { rows } = await pool.query('SELECT qr_token FROM consignments WHERE id = $1', [consignmentId])
      expect(rows[0].qr_token).toBeNull()
    })

    it('should fail with NOT_FOUND for non-existent/tampered QR tokens', async () => {
      const res = await request(app)
        .get('/api/consignments/verify-qr/fake-scammed-token-value')
        .set('Authorization', `Bearer ${watchmanToken}`)

      expect(res.statusCode).toEqual(404)
      expect(res.body.valid).toBe(false)
      expect(res.body.reason).toEqual('NOT_FOUND')
    })

    it('should fail with EXPIRED if session token has elapsed', async () => {
      const createRes = await request(app)
        .post('/api/consignments')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ driverId: approvedDriverId, truckId: approvedTruckId, weightTons: 25.5 })

      const consignmentId = createRes.body.data.id

      // Generate QR
      const qrRes = await request(app)
        .post(`/api/consignments/${consignmentId}/qr`)
        .set('Authorization', `Bearer ${operatorToken}`)

      const token = qrRes.body.data.consignment.qr_token

      // Force session expiry in database
      await pool.query("UPDATE consignments SET qr_expires_at = NOW() - INTERVAL '1 second' WHERE id = $1", [consignmentId])

      const res = await request(app)
        .get(`/api/consignments/verify-qr/${token}`)
        .set('Authorization', `Bearer ${watchmanToken}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body.valid).toBe(false)
      expect(res.body.reason).toEqual('EXPIRED')
    })
  })

  describe('GET /api/consignments (Restricted Listing)', () => {
    it('should allow drivers to view only their assigned consignments', async () => {
      // 1. Create consignment for driver 1 (approvedDriverId)
      await pool.query(`
        INSERT INTO consignments (consignment_number, driver_id, truck_id, weight_tons, status)
        VALUES ('CON-DRV1', $1, $2, 30.0, 'PENDING')
      `, [approvedDriverId, approvedTruckId])

      // 2. Create consignment for driver 2 (pending driver, owned by driver2 user)
      await pool.query(`
        INSERT INTO consignments (consignment_number, driver_id, truck_id, weight_tons, status)
        VALUES ('CON-DRV2', $1, $2, 30.0, 'PENDING')
      `, [unapprovedDriverId, approvedTruckId])

      // 3. Driver 1 queries
      const res = await request(app)
        .get('/api/consignments')
        .set('Authorization', `Bearer ${driverToken}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body.data.length).toEqual(1)
      expect(res.body.data[0].consignment_number).toEqual('CON-DRV1')
    })

    it('should allow OPERATORS to read all consignments globally', async () => {
      const res = await request(app)
        .get('/api/consignments')
        .set('Authorization', `Bearer ${operatorToken}`)

      expect(res.statusCode).toEqual(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })
})
