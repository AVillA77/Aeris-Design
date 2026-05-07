import { Response } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import type { AuthRequest } from '../middleware/auth.js';

const schema = z.object({
  categoryId: z.string().uuid(),
  limitAmount: z.number().positive(),
  period: z.enum(['monthly', 'yearly']).default('monthly'),
});

export async function getBudgets(req: AuthRequest, res: Response) {
  const { rows } = await db.query(
    `SELECT b.*,
       c.name AS category_name, c.color AS category_color,
       COALESCE(SUM(t.amount), 0) AS spent,
       b.limit_amount - COALESCE(SUM(t.amount), 0) AS remaining
     FROM budgets b
     JOIN categories c ON c.id = b.category_id
     LEFT JOIN transactions t
       ON  t.category_id = b.category_id
       AND t.type = 'expense'
       AND (
         (b.period = 'monthly' AND date_trunc('month', t.date) = date_trunc('month', NOW()))
         OR
         (b.period = 'yearly'  AND date_trunc('year',  t.date) = date_trunc('year',  NOW()))
       )
     WHERE b.user_id = $1
     GROUP BY b.id, c.name, c.color
     ORDER BY c.name`,
    [req.user!.userId],
  );
  res.json(rows);
}

export async function getBudget(req: AuthRequest, res: Response) {
  const { rows } = await db.query(
    `SELECT b.*,
       c.name AS category_name, c.color AS category_color,
       COALESCE(SUM(t.amount), 0) AS spent
     FROM budgets b
     JOIN categories c ON c.id = b.category_id
     LEFT JOIN transactions t
       ON  t.category_id = b.category_id AND t.type = 'expense'
       AND date_trunc('month', t.date) = date_trunc('month', NOW())
     WHERE b.id = $1 AND b.user_id = $2
     GROUP BY b.id, c.name, c.color`,
    [req.params.id, req.user!.userId],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Budget not found' });
  res.json(rows[0]);
}

export async function createBudget(req: AuthRequest, res: Response) {
  const data = schema.parse(req.body);
  const userId = req.user!.userId;

  const cat = await db.query(
    'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
    [data.categoryId, userId],
  );
  if (!cat.rows[0]) return res.status(400).json({ error: 'Category not found' });

  const { rows } = await db.query(
    `INSERT INTO budgets (limit_amount, period, category_id, user_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.limitAmount, data.period, data.categoryId, userId],
  );
  res.status(201).json(rows[0]);
}

export async function updateBudget(req: AuthRequest, res: Response) {
  const data = schema.partial().parse(req.body);
  const { id } = req.params;
  const userId = req.user!.userId;

  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.limitAmount !== undefined) { fields.push(`limit_amount = $${idx++}`); params.push(data.limitAmount); }
  if (data.period !== undefined) { fields.push(`period = $${idx++}`); params.push(data.period); }

  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

  fields.push(`updated_at = NOW()`);
  params.push(id, userId);

  const { rows } = await db.query(
    `UPDATE budgets SET ${fields.join(', ')}
     WHERE id = $${idx++} AND user_id = $${idx++} RETURNING *`,
    params,
  );
  if (!rows[0]) return res.status(404).json({ error: 'Budget not found' });
  res.json(rows[0]);
}

export async function deleteBudget(req: AuthRequest, res: Response) {
  const { rows } = await db.query(
    'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user!.userId],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Budget not found' });
  res.status(204).send();
}
