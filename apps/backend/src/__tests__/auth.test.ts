import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { app } from './app.js'
import { db } from '../db/client.js'
import { TEST_USER } from './helpers.js'

const mockDb = vi.mocked(db)

beforeEach(() => vi.clearAllMocks())

describe('POST /api/auth/register', () => {
  it('creates a user and returns tokens', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [] })              // check existing email
      .mockResolvedValueOnce({ rows: [{ ...TEST_USER, role: 'user' }] }) // insert user
      .mockResolvedValueOnce({ rows: [] })              // insert refresh token

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('accessToken')
    expect(res.body).toHaveProperty('refreshToken')
    expect(res.body.user.email).toBe('test@example.com')
  })

  it('returns 409 when email is already taken', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: TEST_USER.id }] })

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'test@example.com',
      password: 'password123',
    })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already in use/i)
  })

  it('returns 400 for invalid payload', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'not-an-email',
      password: 'short',
    })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('returns tokens on valid credentials', async () => {
    const hash = await bcrypt.hash('password123', 10)
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ ...TEST_USER, password: hash }] })
      .mockResolvedValueOnce({ rows: [] })

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
    expect(res.body.user).not.toHaveProperty('password')
  })

  it('returns 401 for wrong password', async () => {
    const hash = await bcrypt.hash('correctpassword', 10)
    mockDb.query.mockResolvedValueOnce({ rows: [{ ...TEST_USER, password: hash }] })

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    })

    expect(res.status).toBe(401)
  })

  it('returns 401 when user does not exist', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    })

    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/logout', () => {
  it('deletes refresh token and returns 200', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app).post('/api/auth/logout').send({
      refreshToken: 'some-token',
    })

    expect(res.status).toBe(200)
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM refresh_tokens'),
      ['some-token'],
    )
  })
})

describe('POST /api/auth/refresh-token', () => {
  it('returns new access token for valid refresh token', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{
        user_id: TEST_USER.id,
        email: TEST_USER.email,
        role: 'user',
        expires_at: new Date(Date.now() + 86400000),
      }],
    })

    const res = await request(app).post('/api/auth/refresh-token').send({
      refreshToken: 'valid-token',
    })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
  })

  it('returns 401 for expired refresh token', async () => {
    mockDb.query.mockResolvedValueOnce({
      rows: [{
        user_id: TEST_USER.id,
        email: TEST_USER.email,
        role: 'user',
        expires_at: new Date(Date.now() - 1000), // expired
      }],
    })

    const res = await request(app).post('/api/auth/refresh-token').send({
      refreshToken: 'expired-token',
    })

    expect(res.status).toBe(401)
  })

  it('returns 400 when refresh token is missing', async () => {
    const res = await request(app).post('/api/auth/refresh-token').send({})
    expect(res.status).toBe(400)
  })
})
