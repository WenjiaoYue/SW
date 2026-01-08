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
    currentProject,
    type ChatMessage
  } from '$lib/stores/appStore';
  import { repoData, isLoadingData, dataError, cachedRepoData } from '$lib/stores/dataStore';
  import { fetchGitHubTopics } from '$lib/services/api';
  import { marked } from 'marked';
  import { get } from 'svelte/store';

  let chatInput = '';
  let previousProject = '';

  $: currentMessages = $currentView === 'repo' ? $repoChatMessages : $modelChatMessages;

  $: if ($currentProject && $currentProject !== previousProject) {
    previousProject = $currentProject;
    if ($currentView === 'repo') {
      loadCachedOrFetchData($currentProject, 7);
    }
  }

  async function loadCachedOrFetchData(repo: string, days: number = 7) {
    const cacheKey = `${repo}_${days}`;
    const cache = get(cachedRepoData);

    if (cache.has(cacheKey)) {
      repoData.set(cache.get(cacheKey)!);
    } else {
      await fetchRepoData(repo, days, false);
    }
  }

  async function fetchRepoData(repo: string, days: number = 7, forceRefresh: boolean = true) {
    isLoadingData.set(true);
    dataError.set(null);

    try {
      const data = await fetchGitHubTopics({ repo, days, max_commits: 10 });
      repoData.set(data);

      const cacheKey = `${repo}_${days}`;
      cachedRepoData.update(cache => {
        cache.set(cacheKey, data);
        return cache;
      });

      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch data';
      dataError.set(errorMsg);
      throw error;
    } finally {
      isLoadingData.set(false);
    }
  }

  function toggleChatDock() {
    chatDockOpen.update(v => !v);
  }

  function toggleChatHistory() {
    chatExpanded.update(v => !v);
  }

  async function sendMessage() {
    if (!chatInput.trim()) return;

    if (!$chatExpanded) {
      chatExpanded.set(true);
    }

    const userMessage: ChatMessage = { type: 'user', content: chatInput };
    const userMessageText = chatInput.toLowerCase();
    chatInput = '';

    if ($currentView === 'repo') {
      repoChatMessages.update(msgs => [...msgs, userMessage]);
      repoChatMessages.update(msgs => [...msgs, { type: 'bot', content: 'Fetching latest data from GitHub...' }]);

      try {
        const currentRepo = get(currentProject);
        const data = await fetchRepoData(currentRepo, 7, true);

        const topicsCount = data.topics?.length || 0;
        const commitsCount = data.commits?.length || 0;
        const prsCount = data.prs_analysis?.length || 0;

        let reply = `Successfully loaded **${commitsCount} commits**, **${topicsCount} hot topics**, and **${prsCount} pull requests** from **${data.repo}**.`;

        if (data.topics && data.topics.length > 0) {
          reply += `\n\n**Key topics:** ${data.topics.slice(0, 3).map(t => t.name).join(', ')}`;
        }

        if (userMessageText.includes('pallas')) {
          commitFilter.set('Pallas');
          reply += '\n\nFiltered to show **Pallas Backend** commits.';
        } else if (userMessageText.includes('rocm')) {
          commitFilter.set('ROCm');
          reply += '\n\nFiltered to show **ROCm** commits.';
        } else if (userMessageText.includes('inductor')) {
          commitFilter.set('Inductor');
          reply += '\n\nFiltered to show **Inductor** commits.';
        } else if (userMessageText.includes('reset') || userMessageText.includes('all')) {
          commitFilter.set('All');
          reply += '\n\nShowing **all commits**.';
        }

        repoChatMessages.update(msgs => {
          const newMsgs = [...msgs];
          newMsgs[newMsgs.length - 1] = { type: 'bot', content: reply };
          return newMsgs;
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch data';
        repoChatMessages.update(msgs => {
          const newMsgs = [...msgs];
          newMsgs[newMsgs.length - 1] = { type: 'bot', content: `Error: ${errorMsg}` };
          return newMsgs;
        });
      }
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
