import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['user', 'admin']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  icon: z.string().optional(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  categoryId: z.string().uuid(),
  userId: z.string().uuid(),
  description: z.string(),
  date: z.date(),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'other']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const BudgetSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  userId: z.string().uuid(),
  limit: z.number().positive(),
  period: z.enum(['monthly', 'yearly']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type Budget = z.infer<typeof BudgetSchema>;
