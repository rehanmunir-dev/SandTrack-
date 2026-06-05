import request from 'supertest'
import app from '../server.js'
import { clearDatabase, seedUsers, closeDatabaseConnection } from './setup.js'
import pool from '../db/pool.js'

describe('Drivers Registry API', () => {
  let adminToken, operatorToken, driverUserRes

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

    // Find seed driver user id
    const { rows } = await pool.query("SELECT id FROM users WHERE username = 'driver'")
    driverUserRes = rows[0]
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  describe('POST /api/drivers', () => {
    it('should fail with 400 validation error if cnic is missing', async () => {
      const res = await request(app)
        .post('/api/drivers')
        .set('Authorization', `Bearer ${operatorToken}`)
        .field('userId', driverUserRes.id)
        .field('licenseNumber', 'AP-87263')

      expect(res.statusCode).toEqual(400)
    })

    it('should create a driver successfully with is_approved=false', async () => {
      const res = await request(app)
        .post('/api/drivers')
        .set('Authorization', `Bearer ${operatorToken}`)
        .field('userId', driverUserRes.id)
        .field('cnic', '42101-1234567-1')
        .field('licenseNumber', 'AP-87263')
        .attach('facePhoto', Buffer.from('fake-image-binary'), 'face.jpg')

      expect(res.statusCode).toEqual(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.is_approved).toBe(false)
      expect(res.body.data.cnic).toEqual('42101-1234567-1')
    })

    it('should return 409 conflict when duplicate cnic is registered', async () => {
      // Register first
      await request(app)
        .post('/api/drivers')
        .set('Authorization', `Bearer ${operatorToken}`)
        .field('userId', driverUserRes.id)
        .field('cnic', '42101-1234567-1')
        .field('licenseNumber', 'AP-87263')

      // Register duplicate
      const res = await request(app)
        .post('/api/drivers')
        .set('Authorization', `Bearer ${operatorToken}`)
        .field('userId', driverUserRes.id)
        .field('cnic', '42101-1234567-1')
        .field('licenseNumber', 'AP-99999')

      expect(res.statusCode).toEqual(409)
    })
  })

  describe('GET /api/drivers', () => {
    it('should return drivers lists with approval status', async () => {
      const res = await request(app)
        .get('/api/drivers')
        .set('Authorization', `Bearer ${operatorToken}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('PATCH /api/drivers/:id/approve', () => {
    it('should allow SUPER_ADMIN to approve a driver, but block OPERATOR', async () => {
      // Create first
      const createRes = await request(app)
        .post('/api/drivers')
        .set('Authorization', `Bearer ${operatorToken}`)
        .field('userId', driverUserRes.id)
        .field('cnic', '42101-1234567-1')
        .field('licenseNumber', 'AP-87263')

      const driverId = createRes.body.data.id

      // OPERATOR attempts approval
      const operatorApproveRes = await request(app)
        .patch(`/api/drivers/${driverId}/approve`)
        .set('Authorization', `Bearer ${operatorToken}`)

      expect(operatorApproveRes.statusCode).toEqual(403)

      // SUPER_ADMIN approves
      const adminApproveRes = await request(app)
        .patch(`/api/drivers/${driverId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(adminApproveRes.statusCode).toEqual(200)
      expect(adminApproveRes.body.success).toBe(true)
      expect(adminApproveRes.body.data.is_approved).toBe(true)
    })
  })

  describe('PATCH /api/drivers/:id', () => {
    it('should update driver properties successfully', async () => {
      const createRes = await request(app)
        .post('/api/drivers')
        .set('Authorization', `Bearer ${operatorToken}`)
        .field('userId', driverUserRes.id)
        .field('cnic', '42101-1234567-1')
        .field('licenseNumber', 'AP-87263')

      const driverId = createRes.body.data.id

      const res = await request(app)
        .patch(`/api/drivers/${driverId}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ licenseNumber: 'UPDATED-AP-999' })

      expect(res.statusCode).toEqual(200)
      expect(res.body.data.license_number).toEqual('UPDATED-AP-999')
    })
  })
})
