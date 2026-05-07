import { Router } from 'express';
import { register, login, logout, refreshToken } from '../controllers/auth.js';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/logout', logout);
authRoutes.post('/refresh-token', refreshToken);
