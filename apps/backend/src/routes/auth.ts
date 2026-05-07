import { Router } from 'express';

export const authRoutes = Router();

authRoutes.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint - TODO: Implement' });
});

authRoutes.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - TODO: Implement' });
});

authRoutes.post('/logout', (req, res) => {
  res.json({ message: 'Logout endpoint - TODO: Implement' });
});

authRoutes.post('/refresh-token', (req, res) => {
  res.json({ message: 'Refresh token endpoint - TODO: Implement' });
});
