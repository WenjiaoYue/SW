import { writable, derived } from 'svelte/store';

export type ViewType = 'repo' | 'model';

export interface ChatMessage {
  type: 'bot' | 'user';
  content: string;
}

export const currentView = writable<ViewType>('repo');
export const currentProject = writable('PyTorch / core');
export const chatDockOpen = writable(false);
export const chatExpanded = writable(false);
export const selectedModelKey = writable('DeepSeek');
export const showModelDetail = writable(false);
export const commitFilter = writable<string>('All');

export const repoChatMessages = writable<ChatMessage[]>([
  {
    type: 'bot',
    content: "Hello! I'm monitoring PyTorch commits. Click the chart to filter commits."
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
