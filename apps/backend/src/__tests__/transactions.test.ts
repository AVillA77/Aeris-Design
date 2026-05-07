import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from './app.js'
import { db } from '../db/client.js'
import { authHeader, TEST_TRANSACTION, TEST_CATEGORY } from './helpers.js'

const mockDb = vi.mocked(db)

beforeEach(() => vi.clearAllMocks())

describe('GET /api/transactions', () => {
  it('returns paginated transactions', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [TEST_TRANSACTION] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })

    const res = await request(app)
      .get('/api/transactions')
      .set(authHeader())

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.total).toBe(1)
  })

  it('filters by type', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })

    const res = await request(app)
      .get('/api/transactions?type=income')
      .set(authHeader())

    expect(res.status).toBe(200)
    const [call] = mockDb.query.mock.calls
    expect(call[0]).toContain('t.type =')
  })

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/transactions')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/transactions', () => {
  it('creates a transaction', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [TEST_CATEGORY] })   // category check
      .mockResolvedValueOnce({ rows: [TEST_TRANSACTION] }) // insert

    const res = await request(app)
      .post('/api/transactions')
      .set(authHeader())
      .send({
        type: 'expense',
        amount: 50,
        description: 'Lunch',
        date: '2025-05-01',
        paymentMethod: 'cash',
        categoryId: TEST_CATEGORY.id,
      })

    expect(res.status).toBe(201)
    expect(res.body.amount).toBe(50)
  })

  it('returns 400 when category does not belong to user', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] }) // category not found

    const res = await request(app)
      .post('/api/transactions')
      .set(authHeader())
      .send({
        type: 'expense',
        amount: 50,
        description: 'Lunch',
        date: '2025-05-01',
        paymentMethod: 'cash',
        categoryId: TEST_CATEGORY.id,
      })

    expect(res.status).toBe(400)
  })

  it('returns 400 for negative amount', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set(authHeader())
      .send({
        type: 'expense',
        amount: -10,
        date: '2025-05-01',
        paymentMethod: 'cash',
        categoryId: TEST_CATEGORY.id,
      })

    expect(res.status).toBe(400)
  })
})

describe('PUT /api/transactions/:id', () => {
  it('updates a transaction', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ ...TEST_TRANSACTION, amount: 99 }] })

    const res = await request(app)
      .put(`/api/transactions/${TEST_TRANSACTION.id}`)
      .set(authHeader())
      .send({ amount: 99 })

    expect(res.status).toBe(200)
    expect(res.body.amount).toBe(99)
  })

  it('returns 404 when not found or wrong user', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .put('/api/transactions/non-existent-id')
      .set(authHeader())
      .send({ amount: 99 })

    expect(res.status).toBe(404)
  })

  it('returns 400 when no fields provided', async () => {
    const res = await request(app)
      .put(`/api/transactions/${TEST_TRANSACTION.id}`)
      .set(authHeader())
      .send({})

    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/transactions/:id', () => {
  it('deletes a transaction and returns 204', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: TEST_TRANSACTION.id }] })

    const res = await request(app)
      .delete(`/api/transactions/${TEST_TRANSACTION.id}`)
      .set(authHeader())

    expect(res.status).toBe(204)
  })

  it('returns 404 when not found', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] })

    const res = await request(app)
      .delete('/api/transactions/non-existent-id')
      .set(authHeader())

    expect(res.status).toBe(404)
  })
})
