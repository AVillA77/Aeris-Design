import { Router } from 'express';

export const budgetRoutes = Router();

budgetRoutes.get('/', (req, res) => {
  res.json({ message: 'Get all budgets - TODO: Implement' });
});

budgetRoutes.get('/:id', (req, res) => {
  res.json({ message: 'Get budget by ID - TODO: Implement' });
});

budgetRoutes.post('/', (req, res) => {
  res.json({ message: 'Create budget - TODO: Implement' });
});

budgetRoutes.put('/:id', (req, res) => {
  res.json({ message: 'Update budget - TODO: Implement' });
});

budgetRoutes.delete('/:id', (req, res) => {
  res.json({ message: 'Delete budget - TODO: Implement' });
});

budgetRoutes.get('/:id/status', (req, res) => {
  res.json({ message: 'Get budget status - TODO: Implement' });
});
