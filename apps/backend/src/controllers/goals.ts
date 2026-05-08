import { Response } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import type { AuthRequest } from '../middleware/auth.js';

const schema = z.object({
  name: z.string().min(1),
  target: z.number().positive(),
  saved: z.number().min(0).optional(),
  color: z.string().optional(),
  deadline: z.string().date().optional(),
});

export async function getGoals(req: AuthRequest, res: Response) {
  const { rows } = await db.query(
    `SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user!.userId],
  );
  res.json(rows);
}

export async function getGoal(req: AuthRequest, res: Response) {
  const { rows } = await db.query(
    `SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user!.userId],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Savings goal not found' });
  res.json(rows[0]);
}

export async function createGoal(req: AuthRequest, res: Response) {
  const data = schema.parse(req.body);
  const userId = req.user!.userId;

  const { rows } = await db.query(
    `INSERT INTO savings_goals (name, target, saved, color, deadline, user_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      data.name,
      data.target,
      data.saved ?? 0,
      data.color ?? '#3b5bdb',
      data.deadline ?? null,
      userId,
    ],
  );
  res.status(201).json(rows[0]);
}

export async function updateGoal(req: AuthRequest, res: Response) {
  const data = schema.partial().parse(req.body);
  const { id } = req.params;
  const userId = req.user!.userId;

  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined)     { fields.push(`name = $${idx++}`);     params.push(data.name); }
  if (data.target !== undefined)   { fields.push(`target = $${idx++}`);   params.push(data.target); }
  if (data.saved !== undefined)    { fields.push(`saved = $${idx++}`);    params.push(data.saved); }
  if (data.color !== undefined)    { fields.push(`color = $${idx++}`);    params.push(data.color); }
  if (data.deadline !== undefined) { fields.push(`deadline = $${idx++}`); params.push(data.deadline); }

  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

  fields.push(`updated_at = NOW()`);
  params.push(id, userId);

  const { rows } = await db.query(
    `UPDATE savings_goals SET ${fields.join(', ')}
     WHERE id = $${idx++} AND user_id = $${idx++} RETURNING *`,
    params,
  );
  if (!rows[0]) return res.status(404).json({ error: 'Savings goal not found' });
  res.json(rows[0]);
}

export async function deleteGoal(req: AuthRequest, res: Response) {
  const { rows } = await db.query(
    'DELETE FROM savings_goals WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user!.userId],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Savings goal not found' });
  res.status(204).send();
}
