import { request } from './apiService';

export type Draft = {
  _id: string;
  name: string;
  duration: number;
  effect: string;
  roomId?: string;
  audioFileId?: string;
  createdAt?: string;
};

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

export const getDraftAudio = (draftId: string) => request(`/drafts/${draftId}/audio`);
