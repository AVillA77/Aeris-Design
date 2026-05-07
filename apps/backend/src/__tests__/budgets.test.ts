import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from './app.js'
import { db } from '../db/client.js'
import { authHeader, TEST_BUDGET, TEST_CATEGORY } from './helpers.js'

const mockDb = vi.mocked(db)

beforeEach(() => vi.clearAllMocks())

describe('GET /api/budgets', () => {
  it('returns all budgets with spending info', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [TEST_BUDGET] })

    const res = await request(app)
      .get('/api/budgets')
      .set(authHeader())

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].limit_amount).toBe(500)
    expect(res.body[0].spent).toBe(50)
  })

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/budgets')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/budgets/:id', () => {
  it('returns a single budget', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [TEST_BUDGET] })

    const res = await request(app)
      .get(`/api/budgets/${TEST_BUDGET.id}`)
      .set(authHeader())

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(TEST_BUDGET.id)
  })

  it('returns 404 when not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .get('/api/budgets/non-existent')
      .set(authHeader())

    expect(res.status).toBe(404)
  })
})

describe('POST /api/budgets', () => {
  it('creates a budget', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [TEST_CATEGORY] }) // category check
      .mockResolvedValueOnce({ rows: [TEST_BUDGET] })    // insert

    const res = await request(app)
      .post('/api/budgets')
      .set(authHeader())
      .send({
        categoryId: TEST_CATEGORY.id,
        limitAmount: 500,
        period: 'monthly',
      })

    expect(res.status).toBe(201)
    expect(res.body.limit_amount).toBe(500)
  })

  it('returns 400 when category does not exist', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .post('/api/budgets')
      .set(authHeader())
      .send({
        categoryId: TEST_CATEGORY.id,
        limitAmount: 500,
        period: 'monthly',
      })

    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid limit', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set(authHeader())
      .send({
        categoryId: TEST_CATEGORY.id,
        limitAmount: -100,
        period: 'monthly',
      })

    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid period', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set(authHeader())
      .send({
        categoryId: TEST_CATEGORY.id,
        limitAmount: 500,
        period: 'weekly',
      })

    expect(res.status).toBe(400)
  })
})

describe('PUT /api/budgets/:id', () => {
  it('updates limit amount', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ ...TEST_BUDGET, limit_amount: 800 }] })

    const res = await request(app)
      .put(`/api/budgets/${TEST_BUDGET.id}`)
      .set(authHeader())
      .send({ limitAmount: 800 })

    expect(res.status).toBe(200)
    expect(res.body.limit_amount).toBe(800)
  })

  it('returns 404 when not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .put('/api/budgets/non-existent')
      .set(authHeader())
      .send({ limitAmount: 800 })

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/budgets/:id', () => {
  it('deletes a budget and returns 204', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: TEST_BUDGET.id }] })

    const res = await request(app)
      .delete(`/api/budgets/${TEST_BUDGET.id}`)
      .set(authHeader())

    expect(res.status).toBe(204)
  })

  it('returns 404 when not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .delete('/api/budgets/non-existent')
      .set(authHeader())

    expect(res.status).toBe(404)
  })
})
