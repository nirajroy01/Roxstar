import { request } from './apiService';
import type { Draft } from '../types/draft';

export type { Draft };

export const listDrafts = () => request<Draft[]>('/drafts');

export const createDraft = (payload: {
  name: string;
  duration: number;
  effect: string;
  roomId?: string;
}) =>
  request<Draft>('/drafts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getDraft = (draftId: string) => request<Draft>(`/drafts/${draftId}`);

export const deleteDraft = (draftId: string) =>
  request(`/drafts/${draftId}`, {
    method: 'DELETE',
  });

// getDraftAudio is intentionally omitted — remote audio is disabled during local-storage phase.
// When GridFS is enabled, restore: request(`/drafts/${draftId}/audio`)
