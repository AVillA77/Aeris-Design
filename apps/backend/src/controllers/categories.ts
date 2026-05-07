import { Response } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import type { AuthRequest } from '../middleware/auth.js';

const schema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
  icon: z.string().optional(),
});

export async function getCategories(req: AuthRequest, res: Response) {
  const { rows } = await db.query(
    `SELECT c.*,
       COUNT(t.id)::int AS transaction_count,
       COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount END), 0) AS total_expenses
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id
     WHERE c.user_id = $1
     GROUP BY c.id
     ORDER BY c.name`,
    [req.user!.userId],
  );
  res.json(rows);
}

export async function createCategory(req: AuthRequest, res: Response) {
  const data = schema.parse(req.body);
  const { rows } = await db.query(
    'INSERT INTO categories (name, color, icon, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [data.name, data.color, data.icon ?? null, req.user!.userId],
  );
  res.status(201).json(rows[0]);
}

export async function updateCategory(req: AuthRequest, res: Response) {
  const data = schema.partial().parse(req.body);
  const { id } = req.params;
  const userId = req.user!.userId;

  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); params.push(data.name); }
  if (data.color !== undefined) { fields.push(`color = $${idx++}`); params.push(data.color); }
  if (data.icon !== undefined) { fields.push(`icon = $${idx++}`); params.push(data.icon); }

  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

  fields.push(`updated_at = NOW()`);
  params.push(id, userId);

  const { rows } = await db.query(
    `UPDATE categories SET ${fields.join(', ')}
     WHERE id = $${idx++} AND user_id = $${idx++} RETURNING *`,
    params,
  );
  if (!rows[0]) return res.status(404).json({ error: 'Category not found' });
  res.json(rows[0]);
}

export async function deleteCategory(req: AuthRequest, res: Response) {
  const txCheck = await db.query(
    'SELECT COUNT(*) FROM transactions WHERE category_id = $1',
    [req.params.id],
  );
  if (parseInt(txCheck.rows[0].count, 10) > 0) {
    return res.status(409).json({ error: 'Category has transactions and cannot be deleted' });
  }

  const { rows } = await db.query(
    'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user!.userId],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Category not found' });
  res.status(204).send();
}
