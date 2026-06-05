import request from 'supertest'
import app from '../server.js'
import { clearDatabase, seedUsers, closeDatabaseConnection } from './setup.js'
import pool from '../db/pool.js'

describe('CEO global activity logs Auditing API', () => {
  let adminToken, operatorToken, watchmanToken, accountantToken
  let approvedDriverId, approvedTruckId, consignmentId

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
    watchmanToken = await loginAndGetToken('watchman')
    accountantToken = await loginAndGetToken('accountant')

    // Seed driver and truck
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

    // Seed consignment
    const cons = await pool.query(`
      INSERT INTO consignments (consignment_number, driver_id, truck_id, weight_tons, status)
      VALUES ('CON-7766', $1, $2, 20.0, 'PENDING') RETURNING id
    `, [approvedDriverId, approvedTruckId])
    consignmentId = cons.rows[0].id
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  it('should block OPERATOR from checking logs, but allow SUPER_ADMIN to query paginated feed', async () => {
    // Operator checks logs (403 block)
    const operatorRead = await request(app)
      .get('/api/activity-logs')
      .set('Authorization', `Bearer ${operatorToken}`)

    expect(operatorRead.statusCode).toEqual(403)

    // Admin checks logs (200 paginated success)
    const adminRead = await request(app)
      .get('/api/activity-logs')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(adminRead.statusCode).toEqual(200)
    expect(adminRead.body.success).toBe(true)
    expect(Array.isArray(adminRead.body.data)).toBe(true)
    expect(adminRead.body.pagination).toBeDefined()
  })

  it('should auto-record staff activities but EXCLUDE SUPER_ADMIN (CEO) actions', async () => {
    // 1. Clear activity logs to start clean
    await pool.query('DELETE FROM activity_logs')

    // 2. OPERATOR registers a new driver
    const driverUserRes = await pool.query("SELECT id FROM users WHERE username = 'driver'")
    await request(app)
      .post('/api/drivers')
      .set('Authorization', `Bearer ${operatorToken}`)
      .field('userId', driverUserRes.rows[0].id)
      .field('cnic', '42101-9999999-9')
      .field('licenseNumber', 'AP-99999')

    // 3. WATCHMAN clears exit gate
    const qrRes = await request(app)
      .post(`/api/consignments/${consignmentId}/qr`)
      .set('Authorization', `Bearer ${operatorToken}`)

    const token = qrRes.body.data.consignment.qr_token

    await request(app)
      .get(`/api/consignments/verify-qr/${token}`)
      .set('Authorization', `Bearer ${watchmanToken}`)

    // 4. ACCOUNTANT verifies cash payment
    const pCreate = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${operatorToken}`)
      .field('consignmentId', consignmentId)
      .field('amount', 3000)
      .field('paymentMethod', 'CASH')

    const paymentId = pCreate.body.data.id

    await request(app)
      .patch(`/api/payments/${paymentId}/verify`)
      .set('Authorization', `Bearer ${accountantToken}`)

    // 5. SUPER_ADMIN (CEO) executes an action (e.g. toggles user status)
    // This should NOT be logged inside activity_logs!
    const opUserRes = await pool.query("SELECT id FROM users WHERE username = 'operator'")
    await request(app)
      .patch(`/api/users/${opUserRes.rows[0].id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })

    // 6. Query all logged activities as SUPER_ADMIN
    const logsRes = await request(app)
      .get('/api/activity-logs')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(logsRes.statusCode).toEqual(200)
    const logs = logsRes.body.data

    // Check staff logs exist
    const hasOperatorReg = logs.some(l => l.action === 'REGISTER_DRIVER')
    const hasWatchmanClear = logs.some(l => l.action === 'GATE_VERIFIED')
    const hasAccountantVerify = logs.some(l => l.action === 'PAYMENT_VERIFIED')

    expect(hasOperatorReg).toBe(true)
    expect(hasWatchmanClear).toBe(true)
    expect(hasAccountantVerify).toBe(true)

    // Check SUPER_ADMIN activity is not present
    const hasAdminLogs = logs.some(l => l.actor_role === 'SUPER_ADMIN')
    expect(hasAdminLogs).toBe(false)
  })
})
