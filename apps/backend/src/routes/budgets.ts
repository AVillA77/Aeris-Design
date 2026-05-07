import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getBudgets, getBudget, createBudget, updateBudget, deleteBudget } from '../controllers/budgets.js';

export const budgetRoutes = Router();

budgetRoutes.use(requireAuth);

budgetRoutes.get('/', getBudgets);
budgetRoutes.get('/:id', getBudget);
budgetRoutes.post('/', createBudget);
budgetRoutes.put('/:id', updateBudget);
budgetRoutes.delete('/:id', deleteBudget);
