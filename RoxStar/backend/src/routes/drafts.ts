import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createDraft, deleteDraft, getDraft, listDrafts } from '../services/draftService.js';
// canAccessDraft, getDraftAudio, uploadAudioToDraft kept imported for future use.
// Audio routes are disabled below (501 stubs) during local-storage phase.
import { canAccessDraft } from '../services/audioService.js';

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

// GRIDFS DISABLED: Audio upload route — returns 501 during local-storage phase.
// To re-enable, restore the original uploadAudioToDraft implementation.
router.post('/:draftId/audio', async (req, res, next) => {
  try {
    const hasAccess = await canAccessDraft(req.params.draftId, req.user!.userId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    return res.status(501).json({
      message: 'Audio upload is temporarily disabled — local audio storage phase',
    });
  } catch (error) {
    return next(error);
  }
});

// GRIDFS DISABLED: Audio download route — returns 501 during local-storage phase.
// To re-enable, restore getDraftAudio + GridFS stream pipe.
router.get('/:draftId/audio', async (_req, res) => {
  return res.status(501).json({
    message: 'Remote audio retrieval is temporarily disabled — local audio storage phase',
  });
});

export default router;
