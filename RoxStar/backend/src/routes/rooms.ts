import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createRoom, getRoom, joinRoom, leaveRoom } from '../services/roomService.js';

const router = Router();

router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const room = await createRoom(req.user!.userId, req.body?.name);
    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
});

router.post('/:code/join', async (req, res, next) => {
  try {
    const room = await joinRoom(req.user!.userId, req.params.code);
    res.json(room);
  } catch (error) {
    next(error);
  }
});

router.post('/:roomId/leave', async (req, res, next) => {
  try {
    const member = await leaveRoom(req.user!.userId, req.params.roomId);
    res.json(member);
  } catch (error) {
    next(error);
  }
});

router.get('/:roomId', async (req, res, next) => {
  try {
    const room = await getRoom(req.params.roomId);
    res.json(room);
  } catch (error) {
    next(error);
  }
});

export default router;
