import { writable, derived } from 'svelte/store';
import type { HFModel, PotentialIssue, RepoFixIssue, XPUSyncIssue } from '$lib/services/api';

export type ViewType = 'repo' | 'model' | 'triton' | 'issues' | 'fixes' | 'sync';

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

export const tritonOps = writable<any[]>([]);
export const tritonOpsLoading = writable(false);
export const tritonOpsError = writable<string | null>(null);

export const tritonInsights = writable<any[]>([]);
export const tritonInsightsLoading = writable(false);
export const tritonInsightsError = writable<string | null>(null);

export type TritonSubView = 'legacy' | 'insights';
export const tritonSubView = writable<TritonSubView>('insights');

export const potentialIssues = writable<PotentialIssue[]>([]);
export const potentialIssuesLoading = writable(false);
export const potentialIssuesError = writable<string | null>(null);

export const repoFixes = writable<RepoFixIssue[]>([]);
export const repoFixesLoading = writable(false);
export const repoFixesError = writable<string | null>(null);

export const xpuSyncIssues = writable<XPUSyncIssue[]>([]);
export const xpuSyncLoading = writable(false);
export const xpuSyncError = writable<string | null>(null);

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

export const tritonChatMessages = writable<ChatMessage[]>([
  {
    type: 'bot',
    content: "Hello! I can help you explore Triton kernel operations and their XPU compatibility."
  }
]);

export const issuesChatMessages = writable<ChatMessage[]>([
  {
    type: 'bot',
    content: "Hello! I can help you analyze potential issues and validation gaps."
  }
]);

export const fixesChatMessages = writable<ChatMessage[]>([
  {
    type: 'bot',
    content: "Hello! I can help you understand repository scan results and suggested fixes."
  }
]);

export const syncChatMessages = writable<ChatMessage[]>([
  {
    type: 'bot',
    content: "Hello! I can help you analyze XPU synchronization and pointer issues."
  }
]);

export const currentChatMessages = derived(
  currentView,
  ($currentView) => {
    if ($currentView === 'repo') return repoChatMessages;
    if ($currentView === 'model') return modelChatMessages;
    if ($currentView === 'triton') return tritonChatMessages;
    if ($currentView === 'issues') return issuesChatMessages;
    if ($currentView === 'fixes') return fixesChatMessages;
    if ($currentView === 'sync') return syncChatMessages;
    return repoChatMessages;
  }
);
