import { writable } from 'svelte/store';
import type { APIResponse } from '$lib/services/api';

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

export const repoData = writable<APIResponse | null>(null);
export const isLoadingData = writable(false);
export const dataError = writable<string | null>(null);
export const cachedRepoData = writable<Map<string, APIResponse>>(new Map());
