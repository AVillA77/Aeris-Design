import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from './app.js'
import { db } from '../db/client.js'
import { authHeader, TEST_CATEGORY } from './helpers.js'

const mockDb = vi.mocked(db)

beforeEach(() => vi.clearAllMocks())

describe('GET /api/categories', () => {
  it('returns all categories for the user', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [TEST_CATEGORY] })

    const res = await request(app)
      .get('/api/categories')
      .set(authHeader())

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Food')
  })

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/categories')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/categories', () => {
  it('creates a category', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [TEST_CATEGORY] })

    const res = await request(app)
      .post('/api/categories')
      .set(authHeader())
      .send({ name: 'Food', color: '#6366f1' })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Food')
  })

  it('returns 400 for invalid color format', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set(authHeader())
      .send({ name: 'Food', color: 'not-a-color' })

    expect(res.status).toBe(400)
  })

  it('returns 400 for empty name', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set(authHeader())
      .send({ name: '', color: '#6366f1' })

    expect(res.status).toBe(400)
  })
})

describe('PUT /api/categories/:id', () => {
  it('updates a category', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ ...TEST_CATEGORY, name: 'Groceries' }] })

    const res = await request(app)
      .put(`/api/categories/${TEST_CATEGORY.id}`)
      .set(authHeader())
      .send({ name: 'Groceries' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Groceries')
  })

  it('returns 404 when not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .put('/api/categories/non-existent')
      .set(authHeader())
      .send({ name: 'New Name' })

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/categories/:id', () => {
  it('deletes a category with no transactions', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })         // no transactions
      .mockResolvedValueOnce({ rows: [{ id: TEST_CATEGORY.id }] }) // delete

    const res = await request(app)
      .delete(`/api/categories/${TEST_CATEGORY.id}`)
      .set(authHeader())

    expect(res.status).toBe(204)
  })

  it('returns 409 when category has transactions', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ count: '3' }] })

    const res = await request(app)
      .delete(`/api/categories/${TEST_CATEGORY.id}`)
      .set(authHeader())

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/transactions/i)
  })
})
