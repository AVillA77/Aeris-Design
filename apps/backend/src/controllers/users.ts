import { Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/client.js';
import type { AuthRequest } from '../middleware/auth.js';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
});

export async function getMe(req: AuthRequest, res: Response) {
  const { rows } = await db.query(
    'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
    [req.user!.userId],
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
}

export async function updateMe(req: AuthRequest, res: Response) {
  const data = updateSchema.parse(req.body);
  const userId = req.user!.userId;

  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); params.push(data.name); }
  if (data.email !== undefined) { fields.push(`email = $${idx++}`); params.push(data.email); }
  if (data.password !== undefined) {
    const hash = await bcrypt.hash(data.password, 12);
    fields.push(`password = $${idx++}`);
    params.push(hash);
  }

  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

  fields.push(`updated_at = NOW()`);
  params.push(userId);

  const { rows } = await db.query(
    `UPDATE users SET ${fields.join(', ')}
     WHERE id = $${idx++} RETURNING id, email, name, role, created_at`,
    params,
  );
  res.json(rows[0]);
}
