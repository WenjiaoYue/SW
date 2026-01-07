<script lang="ts">
  import { GitBranch, Radar, BookOpen } from 'lucide-svelte';
  import { currentView } from '$lib/stores/appStore';

  function switchView(view: 'repo' | 'model') {
    currentView.set(view);
  }
</script>

<aside class="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-20 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
  <div class="h-16 flex items-center px-6 border-b border-slate-200">
    <div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-sm">
      AI
    </div>
    <span class="font-bold text-lg tracking-tight text-slate-800">DevOS</span>
  </div>

  <nav class="flex-1 p-4 space-y-1">
    <div class="px-3 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      Menu
    </div>

    <button
      on:click={() => switchView('repo')}
      class="nav-btn w-full flex items-center px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
      class:active={$currentView === 'repo'}
    >
      <GitBranch class="w-4 h-4 mr-3" />
      <span class="text-sm">Repo Overview</span>
    </button>

    <button
      on:click={() => switchView('model')}
      class="nav-btn w-full flex items-center px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
      class:active={$currentView === 'model'}
    >
      <Radar class="w-4 h-4 mr-3" />
      <span class="text-sm">Model Radar</span>
    </button>
  </nav>

  <div class="p-4 border-t border-slate-200">
    <button class="w-full flex items-center px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition">
      <BookOpen class="w-4 h-4 mr-3" />
      <span class="text-sm">Documentation</span>
    </button>
  </div>
</aside>
