import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createRoom, getRoom, isRoomMember, joinRoom, leaveRoom } from '../services/roomService.js';
import { shareDraftToRoom } from '../services/draftService.js';

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
    const roomId = req.params.roomId;
    const allowed = await isRoomMember(roomId, req.user!.userId);
    if (!allowed) {
      return res.status(403).json({ message: 'You are not a member of this room' });
    }

    const member = await leaveRoom(req.user!.userId, roomId);
    return res.json(member);
  } catch (error) {
    return next(error);
  }
});

router.post('/:roomId/drafts', async (req, res, next) => {
  try {
    const draft = await shareDraftToRoom(req.body?.draftId, req.params.roomId, req.user!.userId);
    res.json(draft);
  } catch (error) {
    next(error);
  }
});

router.get('/:roomId', async (req, res, next) => {
  try {
    const room = await getRoom(req.params.roomId, req.user!.userId);
    res.json(room);
  } catch (error) {
    next(error);
  }
});

export default router;
