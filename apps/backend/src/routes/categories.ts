import { Router } from 'express';

export const categoryRoutes = Router();

categoryRoutes.get('/', (req, res) => {
  res.json({ message: 'Get all categories - TODO: Implement' });
});

categoryRoutes.post('/', (req, res) => {
  res.json({ message: 'Create category - TODO: Implement' });
});

categoryRoutes.put('/:id', (req, res) => {
  res.json({ message: 'Update category - TODO: Implement' });
});

categoryRoutes.delete('/:id', (req, res) => {
  res.json({ message: 'Delete category - TODO: Implement' });
});
