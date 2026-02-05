<script lang="ts">
  import Sidebar from './lib/components/Sidebar.svelte';
  import Header from './lib/components/Header.svelte';
  import RepoOverview from './lib/components/RepoOverview.svelte';
  import ModelRadar from './lib/components/ModelRadar.svelte';
  import TritonKernel from './lib/components/TritonKernel.svelte';
  import PotentialIssues from './lib/components/PotentialIssues.svelte';
  import RepoFix from './lib/components/RepoFix.svelte';
  import XPUSync from './lib/components/XPUSync.svelte';
  import ChatWidget from './lib/components/ChatWidget.svelte';
  import { currentView } from './lib/stores/appStore';
</script>

<div class="flex h-screen w-full">
  <Sidebar />

  <div class="flex-1 flex flex-col h-screen overflow-hidden relative bg-bg">
    <Header />

    <main class="flex-1 overflow-y-auto p-8 pb-32" id="main-scroll-container">
      {#if $currentView === 'repo'}
        <div class="transition-opacity duration-300" class:opacity-0={$currentView !== 'repo'}>
          <RepoOverview />
        </div>
      {:else if $currentView === 'model'}
        <div class="transition-opacity duration-300" class:opacity-0={$currentView !== 'model'}>
          <ModelRadar />
        </div>
      {:else if $currentView === 'triton'}
        <div class="transition-opacity duration-300" class:opacity-0={$currentView !== 'triton'}>
          <TritonKernel />
        </div>
      {:else if $currentView === 'issues'}
        <div class="transition-opacity duration-300" class:opacity-0={$currentView !== 'issues'}>
          <PotentialIssues />
        </div>
      {:else if $currentView === 'fixes'}
        <div class="transition-opacity duration-300" class:opacity-0={$currentView !== 'fixes'}>
          <RepoFix />
        </div>
      {:else if $currentView === 'sync'}
        <div class="transition-opacity duration-300" class:opacity-0={$currentView !== 'sync'}>
          <XPUSync />
        </div>
      {/if}
    </main>

    <ChatWidget />
  </div>
</div>
