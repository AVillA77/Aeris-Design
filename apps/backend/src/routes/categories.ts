import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categories.js';

export const categoryRoutes = Router();

categoryRoutes.use(requireAuth);

categoryRoutes.get('/', getCategories);
categoryRoutes.post('/', createCategory);
categoryRoutes.put('/:id', updateCategory);
categoryRoutes.delete('/:id', deleteCategory);
