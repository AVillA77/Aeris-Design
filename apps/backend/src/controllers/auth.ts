import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/client.js';
import { signAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { seedDefaultCategories } from '../db/seeds.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const REFRESH_TOKEN_TTL_DAYS = 30;

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [data.email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const hash = await bcrypt.hash(data.password, 12);
  const { rows } = await db.query(
    `INSERT INTO users (email, name, password) VALUES ($1, $2, $3)
     RETURNING id, email, name, role, created_at`,
    [data.email, data.name, hash],
  );

  const user = rows[0];
  const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 86400 * 1000);

  await Promise.all([
    db.query(
      'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
      [refreshToken, user.id, expiresAt],
    ),
    seedDefaultCategories(user.id),
  ]);

  res.status(201).json({ user, accessToken, refreshToken });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const { rows } = await db.query(
    'SELECT id, email, name, password, role FROM users WHERE email = $1',
    [data.email],
  );
  const user = rows[0];

  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { password: _, ...userPublic } = user;
  const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 86400 * 1000);

  await db.query(
    'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
    [refreshToken, user.id, expiresAt],
  );

  res.json({ user: userPublic, accessToken, refreshToken });
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  }
  res.json({ message: 'Logged out' });
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  const { rows } = await db.query(
    `SELECT rt.user_id, rt.expires_at, u.email, u.role
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token = $1`,
    [refreshToken],
  );

  const record = rows[0];
  if (!record || new Date(record.expires_at) < new Date()) {
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const newAccessToken = signAccessToken({
    userId: record.user_id,
    email: record.email,
    role: record.role,
  });

  res.json({ accessToken: newAccessToken });
}
