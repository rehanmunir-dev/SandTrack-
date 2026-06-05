import request from 'supertest'
import app from '../server.js'
import { clearDatabase, seedUsers, closeDatabaseConnection } from './setup.js'

describe('Authentication API Endpoints', () => {
  beforeEach(async () => {
    await clearDatabase()
    await seedUsers()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials and set refresh cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin' })

      expect(res.statusCode).toEqual(200)
      expect(res.body.success).toBe(true)
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.user).toBeDefined()
      expect(res.body.user.role).toEqual('SUPER_ADMIN')

      // Check refresh token cookie is set
      const cookies = res.headers['set-cookie']
      expect(cookies).toBeDefined()
      expect(cookies[0]).toContain('refreshToken')
      expect(cookies[0]).toContain('HttpOnly')
    })

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpassword' })

      expect(res.statusCode).toEqual(401)
      expect(res.body.success).toBe(false)
    })

    it('should reject login for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'password' })

      expect(res.statusCode).toEqual(401)
      expect(res.body.success).toBe(false)
    })

    it('should return 400 validation error for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: '' })

      expect(res.statusCode).toEqual(400)
      expect(res.body.success).toBe(false)
      expect(res.body.errors).toBeDefined()
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should clear refresh token cookie and logout', async () => {
      const res = await request(app)
        .post('/api/auth/logout')

      expect(res.statusCode).toEqual(200)
      expect(res.body.success).toBe(true)
      const cookies = res.headers['set-cookie']
      expect(cookies[0]).toContain('refreshToken=;')
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should return 401 when refresh cookie is missing', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')

      expect(res.statusCode).toEqual(401)
      expect(res.body.success).toBe(false)
    })

    it('should return 403 when tampered refresh cookie is sent', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=invalidcookiehere'])

      expect(res.statusCode).toEqual(403)
      expect(res.body.success).toBe(false)
    })

    it('should generate a new access token when valid refresh cookie is sent', async () => {
      // Login first to get cookie
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin' })

      const cookies = loginRes.headers['set-cookie']

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookies)

      expect(res.statusCode).toEqual(200)
      expect(res.body.success).toBe(true)
      expect(res.body.accessToken).toBeDefined()
    })
  })

  describe('POST /api/auth/forgot-password', () => {
    it('should return 200 for existing user and return token', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ username: 'admin' })

      expect(res.statusCode).toEqual(200)
      expect(res.body.success).toBe(true)
      expect(res.body.token).toBeDefined()
    })

    it('should still return 200 for non-existent user for security integrity', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ username: 'fakeuser' })

      expect(res.statusCode).toEqual(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('POST /api/auth/reset-password', () => {
    it('should reset password successfully with valid token', async () => {
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ username: 'admin' })

      const token = forgotRes.body.token

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, newPassword: 'newsecurepassword' })

      expect(res.statusCode).toEqual(200)
      expect(res.body.success).toBe(true)

      // Verify the new password logs in
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'newsecurepassword' })

      expect(loginRes.statusCode).toEqual(200)
    })

    it('should fail to reset with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'wrongtoken', newPassword: 'newsecurepassword' })

      expect(res.statusCode).toEqual(400)
      expect(res.body.success).toBe(false)
    })
  })
})
