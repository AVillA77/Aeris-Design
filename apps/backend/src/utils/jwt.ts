import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}
