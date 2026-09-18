import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getUserProfile } from '../services/userService.js';

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

export default router;
