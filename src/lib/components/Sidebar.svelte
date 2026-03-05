<script lang="ts">
  import { GitBranch, Radar, BookOpen, Cpu, AlertTriangle, Wrench, RefreshCw, Shield } from 'lucide-svelte';
  import { currentView } from '$lib/stores/appStore';
  import type { ViewType } from '$lib/stores/appStore';

  function switchView(view: ViewType) {
    currentView.set(view);
  }
</script>

<aside class="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col z-20 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
  <div class="h-16 flex items-center px-6 border-b border-slate-200">
    <div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-sm">
      AI
    </div>
    <span class="font-bold text-lg tracking-tight text-slate-800">DevAgent</span>
  </div>

  <nav class="flex-1 p-4 space-y-2">
    <!-- <div class="px-3 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      Menu
    </div> -->

    <button
      on:click={() => switchView('repo')}
      class="nav-btn w-full flex items-center px-4 py-3 mb-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
      class:active={$currentView === 'repo'}
    >
      <GitBranch class="w-4 h-4 mr-3" />
      <span class="text-sm">Repo Hot Topics</span>
    </button>

    <button
      on:click={() => switchView('model')}
      class="nav-btn w-full flex items-center px-4 py-3 mb-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
      class:active={$currentView === 'model'}
    >
      <Radar class="w-4 h-4 mr-3" />
      <span class="text-sm">New Model Tracking</span>
    </button>

    <button
      on:click={() => switchView('triton')}
      class="nav-btn w-full flex items-center px-4 py-3 mb-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
      class:active={$currentView === 'triton'}
    >
      <Cpu class="w-4 h-4 mr-3" />
      <span class="text-sm">Cuda to Triton</span>
    </button>

    <button
      on:click={() => switchView('issues')}
      class="nav-btn w-full flex items-center px-4 py-3 mb-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
      class:active={$currentView === 'issues'}
    >
      <AlertTriangle class="w-4 h-4 mr-3" />
      <span class="text-sm">Code Defect Scan</span>
    </button>

    <button
      on:click={() => switchView('fixes')}
      class="nav-btn w-full flex items-center px-4 py-3 mb-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
      class:active={$currentView === 'fixes'}
    >
      <Wrench class="w-4 h-4 mr-3" />
      <span class="text-sm">Cuda Kernel Alignment</span>
    </button>

    <!-- Cuda Fix Alignment with Details submenu -->
    <div class="mb-2">
      <button
        on:click={() => switchView('scan')}
        class="nav-btn w-full flex items-center px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        class:active={$currentView === 'scan'}
      >
        <Shield class="w-4 h-4 mr-3" />
        <span class="text-sm">Cuda Fix Alignment</span>
      </button>
      <ul class="pl-6 border-l border-slate-200 ml-2 mt-2">
        <li>
          <button
            on:click={() => switchView('sync')}
            class="nav-btn w-full flex items-center px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            class:active={$currentView === 'sync'}
          >
            <RefreshCw class="w-4 h-4 mr-3" />
            <span class="text-sm">Details</span>
          </button>
        </li>
      </ul>
    </div>
  </nav>

  <!-- <div class="p-4 border-t border-slate-200">
    <button class="w-full flex items-center px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition">
      <BookOpen class="w-4 h-4 mr-3" />
      <span class="text-sm">Documentation</span>
    </button>
  </div> -->
</aside>
