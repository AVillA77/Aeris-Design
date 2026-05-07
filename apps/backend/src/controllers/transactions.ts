import { Response } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import type { AuthRequest } from '../middleware/auth.js';

const createSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  description: z.string().default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'other']).default('cash'),
  categoryId: z.string().uuid(),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function getTransactions(req: AuthRequest, res: Response) {
  const { page, limit, type, categoryId, from, to } = querySchema.parse(req.query);
  const userId = req.user!.userId;
  const offset = (page - 1) * limit;

  const conditions: string[] = ['t.user_id = $1'];
  const params: unknown[] = [userId];
  let idx = 2;

  if (type) { conditions.push(`t.type = $${idx++}`); params.push(type); }
  if (categoryId) { conditions.push(`t.category_id = $${idx++}`); params.push(categoryId); }
  if (from) { conditions.push(`t.date >= $${idx++}`); params.push(from); }
  if (to) { conditions.push(`t.date <= $${idx++}`); params.push(to); }

  const where = conditions.join(' AND ');

  const [{ rows }, { rows: countRows }] = await Promise.all([
    db.query(
      `SELECT t.*, c.name AS category_name, c.color AS category_color
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE ${where}
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset],
    ),
    db.query(`SELECT COUNT(*) FROM transactions t WHERE ${where}`, params),
  ]);

  res.json({
    data: rows,
    total: parseInt(countRows[0].count, 10),
    page,
    limit,
  });
}

export async function getTransaction(req: AuthRequest, res: Response) {
  const { rows } = await db.query(
    `SELECT t.*, c.name AS category_name, c.color AS category_color
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.id = $1 AND t.user_id = $2`,
    [req.params.id, req.user!.userId],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Transaction not found' });
  res.json(rows[0]);
}

export async function createTransaction(req: AuthRequest, res: Response) {
  const data = createSchema.parse(req.body);
  const userId = req.user!.userId;

  const cat = await db.query(
    'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
    [data.categoryId, userId],
  );
  if (!cat.rows[0]) return res.status(400).json({ error: 'Category not found' });

  const { rows } = await db.query(
    `INSERT INTO transactions (type, amount, description, date, payment_method, category_id, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.type, data.amount, data.description, data.date, data.paymentMethod, data.categoryId, userId],
  );
  res.status(201).json(rows[0]);
}

export async function updateTransaction(req: AuthRequest, res: Response) {
  const data = createSchema.partial().parse(req.body);
  const { id } = req.params;
  const userId = req.user!.userId;

  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.type !== undefined) { fields.push(`type = $${idx++}`); params.push(data.type); }
  if (data.amount !== undefined) { fields.push(`amount = $${idx++}`); params.push(data.amount); }
  if (data.description !== undefined) { fields.push(`description = $${idx++}`); params.push(data.description); }
  if (data.date !== undefined) { fields.push(`date = $${idx++}`); params.push(data.date); }
  if (data.paymentMethod !== undefined) { fields.push(`payment_method = $${idx++}`); params.push(data.paymentMethod); }
  if (data.categoryId !== undefined) { fields.push(`category_id = $${idx++}`); params.push(data.categoryId); }

  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

  fields.push(`updated_at = NOW()`);
  params.push(id, userId);

  const { rows } = await db.query(
    `UPDATE transactions SET ${fields.join(', ')}
     WHERE id = $${idx++} AND user_id = $${idx++} RETURNING *`,
    params,
  );
  if (!rows[0]) return res.status(404).json({ error: 'Transaction not found' });
  res.json(rows[0]);
}

export async function deleteTransaction(req: AuthRequest, res: Response) {
  const { rows } = await db.query(
    'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user!.userId],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Transaction not found' });
  res.status(204).send();
}
