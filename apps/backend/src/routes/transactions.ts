import { Router } from 'express';

export const transactionRoutes = Router();

transactionRoutes.get('/', (req, res) => {
  res.json({ message: 'Get all transactions - TODO: Implement' });
});

transactionRoutes.get('/:id', (req, res) => {
  res.json({ message: 'Get transaction by ID - TODO: Implement' });
});

transactionRoutes.post('/', (req, res) => {
  res.json({ message: 'Create transaction - TODO: Implement' });
});

transactionRoutes.put('/:id', (req, res) => {
  res.json({ message: 'Update transaction - TODO: Implement' });
});

transactionRoutes.delete('/:id', (req, res) => {
  res.json({ message: 'Delete transaction - TODO: Implement' });
});
