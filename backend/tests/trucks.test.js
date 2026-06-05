import request from 'supertest'
import app from '../server.js'
import { clearDatabase, seedUsers, closeDatabaseConnection } from './setup.js'

describe('Trucks Fleet Registry API', () => {
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

  describe('POST /api/trucks', () => {
    it('should create truck successfully with valid data', async () => {
      const res = await request(app)
        .post('/api/trucks')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          registrationNumber: 'LHR-8822',
          vehicleType: 'Damper',
          wheelCount: 14,
          ownerName: 'Mubeen Shah'
        })

      expect(res.statusCode).toEqual(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.is_approved).toBe(false)
    })

    it('should reject invalid wheel_count (e.g. 10) with 400 validation error', async () => {
      const res = await request(app)
        .post('/api/trucks')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          registrationNumber: 'LHR-8822',
          vehicleType: 'Damper',
          wheelCount: 10,
          ownerName: 'Mubeen Shah'
        })

      expect(res.statusCode).toEqual(400)
    })

    it('should reject invalid vehicle_type with 400 validation error', async () => {
      const res = await request(app)
        .post('/api/trucks')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          registrationNumber: 'LHR-8822',
          vehicleType: 'Airplane',
          wheelCount: 14
        })

      expect(res.statusCode).toEqual(400)
    })

    it('should reject duplicate registration number with 409 conflict', async () => {
      await request(app)
        .post('/api/trucks')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          registrationNumber: 'LHR-8822',
          vehicleType: 'Damper',
          wheelCount: 14
        })

      const res = await request(app)
        .post('/api/trucks')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          registrationNumber: 'LHR-8822',
          vehicleType: 'Suzuki',
          wheelCount: 8
        })

      expect(res.statusCode).toEqual(409)
    })
  })

  describe('PATCH /api/trucks/:id/approve', () => {
    it('should approve a truck as SUPER_ADMIN successfully', async () => {
      const createRes = await request(app)
        .post('/api/trucks')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          registrationNumber: 'LHR-8822',
          vehicleType: 'Damper',
          wheelCount: 14
        })

      const truckId = createRes.body.data.id

      const res = await request(app)
        .patch(`/api/trucks/${truckId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body.data.is_approved).toBe(true)
    })
  })
})
