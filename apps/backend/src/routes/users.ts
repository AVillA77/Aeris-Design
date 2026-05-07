import { Router } from 'express';

export const userRoutes = Router();

userRoutes.get('/me', (req, res) => {
  res.json({ message: 'Get current user - TODO: Implement' });
});

userRoutes.put('/me', (req, res) => {
  res.json({ message: 'Update current user - TODO: Implement' });
});

userRoutes.get('/:id', (req, res) => {
  res.json({ message: 'Get user by ID - TODO: Implement' });
});

userRoutes.post('/:id/invite', (req, res) => {
  res.json({ message: 'Invite user to shared wallet - TODO: Implement' });
});
