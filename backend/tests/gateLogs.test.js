import request from 'supertest'
import app from '../server.js'
import { clearDatabase, seedUsers, closeDatabaseConnection } from './setup.js'
import pool from '../db/pool.js'

describe('Gate Scanners Verification Logs API', () => {
  let adminToken, watchmanToken, operatorToken
  let approvedDriverId, approvedTruckId

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
    watchmanToken = await loginAndGetToken('watchman')
    operatorToken = await loginAndGetToken('operator')

    // Seed approved driver and truck
    const drv = await pool.query(`
      INSERT INTO drivers (user_id, cnic, license_number, is_approved)
      VALUES (3, '42101-1111111-1', 'AP-11111', true) RETURNING id
    `)
    approvedDriverId = drv.rows[0].id

    const trk = await pool.query(`
      INSERT INTO trucks (registration_number, vehicle_type, wheel_count, is_approved)
      VALUES ('LHR-1111', 'Damper', 14, true) RETURNING id
    `)
    approvedTruckId = trk.rows[0].id
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  it('should block WATCHMAN from reading gate logs with 403, but allow SUPER_ADMIN', async () => {
    // Watchman reads (403 block)
    const watchmanRead = await request(app)
      .get('/api/gate-logs')
      .set('Authorization', `Bearer ${watchmanToken}`)

    expect(watchmanRead.statusCode).toEqual(403)

    // Admin reads (200 success)
    const adminRead = await request(app)
      .get('/api/gate-logs')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(adminRead.statusCode).toEqual(200)
    expect(Array.isArray(adminRead.body.data)).toBe(true)
  })

  it('should record correct gate_log entry after a successful exit gate QR scan', async () => {
    // 1. Create consignment
    const createRes = await request(app)
      .post('/api/consignments')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ driverId: approvedDriverId, truckId: approvedTruckId, weightTons: 25.5 })

    const consignmentId = createRes.body.data.id

    // 2. Generate QR token
    const qrRes = await request(app)
      .post(`/api/consignments/${consignmentId}/qr`)
      .set('Authorization', `Bearer ${operatorToken}`)

    const token = qrRes.body.data.consignment.qr_token

    // 3. Scan QR as watchman
    await request(app)
      .get(`/api/consignments/verify-qr/${token}`)
      .set('Authorization', `Bearer ${watchmanToken}`)

    // 4. Query gate logs as SUPER_ADMIN
    const logsRes = await request(app)
      .get('/api/gate-logs')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(logsRes.statusCode).toEqual(200)
    expect(logsRes.body.data.length).toBeGreaterThan(0)
    
    // Check fields match
    const matchingLog = logsRes.body.data.find(l => l.consignment_id === consignmentId)
    expect(matchingLog).toBeDefined()
    expect(matchingLog.scan_result).toEqual('CLEARED')
  })
})
