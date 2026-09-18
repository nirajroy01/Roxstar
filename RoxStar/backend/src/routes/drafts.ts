import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createDraft, deleteDraft, getDraft, listDrafts } from '../services/draftService.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const drafts = await listDrafts(req.user!.userId);
    res.json(drafts);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const draft = await createDraft(req.user!.userId, req.body?.roomId || null, req.body || {});
    res.status(201).json(draft);
  } catch (error) {
    next(error);
  }
});

router.get('/:draftId', async (req, res, next) => {
  try {
    const draft = await getDraft(req.params.draftId, req.user!.userId);
    res.json(draft);
  } catch (error) {
    next(error);
  }
});

router.delete('/:draftId', async (req, res, next) => {
  try {
    const result = await deleteDraft(req.params.draftId, req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
