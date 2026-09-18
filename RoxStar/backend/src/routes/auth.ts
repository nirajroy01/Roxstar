import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { loginUser, registerUser } from '../services/authService.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const result = await registerUser(name, email, password);
    res.cookie('token', result.token, { httpOnly: true, sameSite: 'lax', secure: false });
    return res.status(201).json({ user: result.user, token: result.token });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await loginUser(email, password);
    res.cookie('token', result.token, { httpOnly: true, sameSite: 'lax', secure: false });
    return res.json({ user: result.user, token: result.token });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  return res.json({ success: true });
});

router.get('/me', authenticate, (req, res) => {
  return res.json({ user: req.user });
});

export default router;
