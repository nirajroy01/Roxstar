import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getSpinById, getSpinState, startSpin } from '../services/spinService.js';

const router = Router();

router.use(authenticate);

router.post('/start', async (req, res, next) => {
  try {
    const spin = await startSpin(req.user!.userId, req.body.roomId);
    res.status(201).json(spin);
  } catch (error) {
    next(error);
  }
});

router.get('/room/:roomId', async (req, res, next) => {
  try {
    const state = await getSpinState(req.params.roomId, req.user!.userId);
    res.json(state);
  } catch (error) {
    next(error);
  }
});

router.get('/:spinId', async (req, res, next) => {
  try {
    res.json(await getSpinById(req.params.spinId, req.user!.userId));
  } catch (error) {
    next(error);
  }
});

router.get('/:spinId/result', async (req, res, next) => {
  try {
    const state = await getSpinById(req.params.spinId, req.user!.userId);
    res.json({ spin: state?.spin, participants: state?.participants });
  } catch (error) {
    next(error);
  }
});

export default router;
