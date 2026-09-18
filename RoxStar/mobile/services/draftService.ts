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

export const shareDraft = (roomId: string, draftId: string) =>
  request<Draft>(`/rooms/${roomId}/drafts`, {
    method: 'POST',
    body: JSON.stringify({ draftId }),
  });

