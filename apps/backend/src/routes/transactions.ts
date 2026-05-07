import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactions.js';

export const transactionRoutes = Router();

transactionRoutes.use(requireAuth);

transactionRoutes.get('/', getTransactions);
transactionRoutes.get('/:id', getTransaction);
transactionRoutes.post('/', createTransaction);
transactionRoutes.put('/:id', updateTransaction);
transactionRoutes.delete('/:id', deleteTransaction);
