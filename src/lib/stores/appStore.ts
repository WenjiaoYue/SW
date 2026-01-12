import { writable, derived } from 'svelte/store';
import type { HFModel } from '$lib/services/api';

export type ViewType = 'repo' | 'model';

export interface ChatMessage {
  type: 'bot' | 'user';
  content: string;
}

export interface ProcessedModel {
  key: string;
  name: string;
  author: string;
  date: string;
  createdAt: string;
  likes: string;
  downloads: string;
  trendingScore: number;
  task: string;
  status: 'Ready' | 'Partial' | 'Blocked';
  score: number[];
  color: string;
  metrics: {
    speed: string;
    vram: string;
    coverage: string;
    context: string;
  };
  tags: string[];
  url: string;
  rawData: HFModel;
}

export const currentView = writable<ViewType>('repo');
export const currentProject = writable('pytorch/pytorch');
export const chatDockOpen = writable(false);
export const chatExpanded = writable(false);
export const selectedModelKey = writable('DeepSeek');
export const commitFilter = writable<string>('All');
export const hfModels = writable<ProcessedModel[]>([]);
export const hfModelsLoading = writable(false);
export const hfModelsError = writable<string | null>(null);
export const hfModelsSummary = writable<string | null>(null);
export const hfModelsLoaded = writable(false);

export const repoChatMessages = writable<ChatMessage[]>([
  {
    type: 'bot',
    content: "Hello! I can help you analyze GitHub repositories.\n\nTry: **fetch latest data** to load commits and topics."
  }
]);

export const modelChatMessages = writable<ChatMessage[]>([
  {
    type: 'bot',
    content: "Hi! I can help you analyze model compatibility and performance metrics."
  }
]);

export const currentChatMessages = derived(
  currentView,
  ($currentView) => $currentView === 'repo' ? repoChatMessages : modelChatMessages
);
