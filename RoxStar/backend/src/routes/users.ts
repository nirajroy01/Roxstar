import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getUserHistory, getUserProfile } from '../services/userService.js';

const router = Router();

router.use(authenticate);

router.get('/me', async (req, res, next) => {
  try {
    const user = await getUserProfile(req.user!.userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.get('/me/history', async (req, res, next) => {
  try {
    res.json(await getUserHistory(req.user!.userId));
  } catch (error) {
    next(error);
  }
});

export default router;
