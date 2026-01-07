import { writable, derived } from 'svelte/store';

export type ViewType = 'repo' | 'model';

export interface ChatMessage {
  type: 'bot' | 'user';
  content: string;
}

export const currentView = writable<ViewType>('repo');
export const currentProject = writable('pytorch/pytorch');
export const chatDockOpen = writable(false);
export const chatExpanded = writable(false);
export const selectedModelKey = writable('DeepSeek');
export const showModelDetail = writable(false);
export const commitFilter = writable<string>('All');

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
