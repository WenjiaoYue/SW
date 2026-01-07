import { writable } from 'svelte/store';
import type { APIResponse } from '$lib/services/api';
import { MOCK_API_RESPONSE } from '$lib/data/constants';

export interface TopicData {
  id: string;
  name: string;
  summary: string;
  keywords: string[];
  contributors: string[];
}

export interface CommitData {
  sha: string;
  message: string;
  author: string;
  date: string;
  topic: string;
  url: string;
}

export const repoData = writable<APIResponse | null>(MOCK_API_RESPONSE as APIResponse);
export const isLoadingData = writable(false);
export const dataError = writable<string | null>(null);
