<script lang="ts">
  import { MessageSquare, ChevronUp, Minimize2, Bot, User, Sparkles } from 'lucide-svelte';
  import {
    chatDockOpen,
    chatExpanded,
    commitFilter,
    currentView,
    repoChatMessages,
    modelChatMessages,
    selectedModelKey,
    type ChatMessage
  } from '$lib/stores/appStore';
  import { marked } from 'marked';
  import { get } from 'svelte/store';

  let chatInput = '';

  $: currentMessages = $currentView === 'repo' ? $repoChatMessages : $modelChatMessages;

  function toggleChatDock() {
    chatDockOpen.update(v => !v);
  }

  function toggleChatHistory() {
    chatExpanded.update(v => !v);
  }

  function sendMessage() {
    if (!chatInput.trim()) return;

    if (!$chatExpanded) {
      chatExpanded.set(true);
    }

    const userMessage: ChatMessage = { type: 'user', content: chatInput };
    const userMessageText = chatInput.toLowerCase();
    chatInput = '';

    if ($currentView === 'repo') {
      repoChatMessages.update(msgs => [...msgs, userMessage]);

      setTimeout(() => {
        let reply = 'Processing...';
        if (userMessageText.includes('pallas')) {
          commitFilter.set('Pallas');
          reply = 'Filtered View: **Pallas Backend** commits.';
        } else if (userMessageText.includes('rocm')) {
          commitFilter.set('ROCm');
          reply = 'Filtered View: **ROCm** commits.';
        } else if (userMessageText.includes('inductor')) {
          commitFilter.set('Inductor');
          reply = 'Filtered View: **Inductor** commits.';
        } else if (userMessageText.includes('reset') || userMessageText.includes('all')) {
          commitFilter.set('All');
          reply = 'Showing **all commits**.';
        } else {
          reply = 'I can help you filter commits. Try asking about "Pallas", "ROCm", or "Inductor".';
        }

        repoChatMessages.update(msgs => [...msgs, { type: 'bot', content: reply }]);
      }, 500);
    } else {
      modelChatMessages.update(msgs => [...msgs, userMessage]);

      setTimeout(() => {
        let reply = 'Processing...';
        const currentModel = get(selectedModelKey);

        if (userMessageText.includes('compatibility') || userMessageText.includes('support')) {
          reply = `The **${currentModel}** model is currently being analyzed for compatibility. Click "Check Compatibility" for detailed information.`;
        } else if (userMessageText.includes('performance') || userMessageText.includes('speed')) {
          reply = 'Performance metrics are shown in the radar chart. Higher values indicate better performance in each category.';
        } else if (userMessageText.includes('vram') || userMessageText.includes('memory')) {
          reply = 'VRAM requirements vary by model. Check the metrics panel for estimated memory usage.';
        } else {
          reply = 'I can help you analyze model metrics and compatibility. Try asking about "compatibility", "performance", or "memory requirements".';
        }

        modelChatMessages.update(msgs => [...msgs, { type: 'bot', content: reply }]);
      }, 500);
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      sendMessage();
    }
  }
</script>

<button
  on:click={toggleChatDock}
  class="fixed bottom-8 right-8 w-12 h-12 bg-blue-600 text-white rounded-full shadow-fab flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-105 active:scale-95 z-50"
  class:hidden={$chatDockOpen}
>
  <MessageSquare class="w-5 h-5" />
</button>

{#if $chatDockOpen}
  <div class="absolute bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none animate-slide-up">
    <div
      class="chat-dock pointer-events-auto bg-white/95 backdrop-blur-xl border border-white/50 shadow-dock rounded-2xl w-[600px] flex flex-col overflow-hidden transition-all"
      class:expanded={$chatExpanded}
    >
      <div class="chat-history bg-slate-50/50 overflow-y-auto px-4">
        <div class="py-4 space-y-4 text-sm">
          {#each currentMessages as message}
            {#if message.type === 'bot'}
              <div class="flex gap-3 animate-fade-in">
                <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot class="w-3 h-3" />
                </div>
                <div class="bg-white border border-slate-200 p-2.5 rounded-xl rounded-tl-none text-slate-800 shadow-sm">
                  {@html marked.parseInline(message.content)}
                </div>
              </div>
            {:else}
              <div class="flex gap-3 flex-row-reverse animate-fade-in">
                <div class="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center flex-shrink-0">
                  <User class="w-3 h-3" />
                </div>
                <div class="bg-blue-50 text-blue-900 border border-blue-100 p-2.5 rounded-xl rounded-tr-none shadow-sm">
                  {message.content}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>

      <div class="p-2 flex items-center gap-2 bg-white relative z-10">
        <button
          on:click={toggleChatHistory}
          class="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors"
          title="Expand/Collapse History"
        >
          <ChevronUp
            class="w-5 h-5 transition-transform"
            style="transform: rotate({$chatExpanded ? '180deg' : '0deg'})"
          />
        </button>

        <div class="h-6 w-px bg-slate-200 mx-1"></div>

        <div class="flex-1 flex items-center px-2">
          <Sparkles class="w-4 h-4 text-blue-600 mr-2" />
          <input
            type="text"
            bind:value={chatInput}
            on:keypress={handleKeyPress}
            class="w-full bg-transparent border-none text-sm focus:outline-none text-slate-800 placeholder-slate-400 font-medium"
            placeholder="Ask Orchestrator..."
            autocomplete="off"
          />
        </div>

        <button
          on:click={toggleChatDock}
          class="p-2 text-slate-600 hover:text-red-500 transition-colors"
          title="Minimize"
        >
          <Minimize2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
{/if}
