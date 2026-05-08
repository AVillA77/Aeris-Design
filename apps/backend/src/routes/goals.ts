import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getGoals, getGoal, createGoal, updateGoal, deleteGoal } from '../controllers/goals.js';

export const goalRoutes = Router();

goalRoutes.use(requireAuth);

goalRoutes.get('/', getGoals);
goalRoutes.get('/:id', getGoal);
goalRoutes.post('/', createGoal);
goalRoutes.put('/:id', updateGoal);
goalRoutes.delete('/:id', deleteGoal);
