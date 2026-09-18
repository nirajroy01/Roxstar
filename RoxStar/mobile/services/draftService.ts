import { request } from './apiService';

export const listDrafts = () => request('/drafts');

export const createDraft = (payload: {
  name: string;
  duration: number;
  effect: string;
  roomId?: string;
}) =>
  request('/drafts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getDraft = (draftId: string) => request(`/drafts/${draftId}`);

export const deleteDraft = (draftId: string) =>
  request(`/drafts/${draftId}`, {
    method: 'DELETE',
  });

export const getDraftAudio = (draftId: string) => request(`/drafts/${draftId}/audio`);
