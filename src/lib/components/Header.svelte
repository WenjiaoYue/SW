<script lang="ts">
  import { ChevronDown, Radar } from 'lucide-svelte';
  import { currentView, currentProject } from '$lib/stores/appStore';

  let projectMenuOpen = false;

  function toggleProjectMenu() {
    projectMenuOpen = !projectMenuOpen;
  }

  function selectProject(name: string) {
    currentProject.set(name);
    projectMenuOpen = false;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.project-menu-container')) {
      projectMenuOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<header class="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-10 relative">
  <div class="relative h-full w-96">
    <div
      class="header-item w-full"
      class:hidden-item={$currentView === 'model'}
    >
      <div class="relative group inline-block project-menu-container">
        <button
          on:click|stopPropagation={toggleProjectMenu}
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
        >
          <span class="text-xs text-slate-400 font-medium uppercase">Project</span>
          <span class="font-bold text-slate-800 text-sm">{$currentProject}</span>
          <ChevronDown class="w-3 h-3 text-slate-600 mt-0.5" />
        </button>

        <div
          class="dropdown-menu absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 z-50"
          class:open={projectMenuOpen}
        >
          <button
            on:click={() => selectProject('PyTorch / core')}
            class="w-full text-left px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 rounded-lg flex items-center gap-2"
          >
            <div class="w-2 h-2 rounded-full bg-orange-500"></div>
            PyTorch Core
          </button>
          <button
            on:click={() => selectProject('vLLM / vllm')}
            class="w-full text-left px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 rounded-lg flex items-center gap-2"
          >
            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
            vLLM Project
          </button>
        </div>
      </div>
    </div>

    <div
      class="header-item flex items-center gap-2"
      class:hidden-item={$currentView === 'repo'}
    >
      <div class="p-1.5 bg-green-100 rounded-md text-green-700">
        <Radar class="w-4 h-4" />
      </div>
      <span class="font-bold text-lg text-slate-800">Model Intelligence Radar</span>
    </div>
  </div>

  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
      <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
      <span class="text-xs font-bold text-green-700">Online</span>
    </div>
  </div>
</header>
