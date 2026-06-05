import request from 'supertest'
import app from '../server.js'
import pool from '../db/pool.js'
import { closeDatabaseConnection } from './setup.js'

describe('Server Health Status Probe API', () => {
  afterAll(async () => {
    await closeDatabaseConnection()
  })

  it('should return 200 with status: ok and db: connected when database is running', async () => {
    const res = await request(app).get('/api/health')
    
    expect(res.statusCode).toEqual(200)
    expect(res.body.status).toEqual('ok')
    expect(res.body.db).toEqual('connected')
  })

  it('should return 503 with status: error and db: disconnected when database is unavailable', async () => {
    // Force a database query failure using Jest spy
    const spy = jest.spyOn(pool, 'query').mockImplementationOnce(() => {
      throw new Error('Postgres pool connection timeout')
    })

    const res = await request(app).get('/api/health')

    expect(res.statusCode).toEqual(503)
    expect(res.body.status).toEqual('error')
    expect(res.body.db).toEqual('disconnected')

    spy.mockRestore()
  })
})
