import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getMe, updateMe } from '../controllers/users.js';

export const userRoutes = Router();

userRoutes.use(requireAuth);

userRoutes.get('/me', getMe);
userRoutes.put('/me', updateMe);
