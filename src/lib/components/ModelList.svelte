<script lang="ts">
  import { onMount } from 'svelte';
  import { Search } from 'lucide-svelte';
  import { selectedModelKey, hfModels, hfModelsLoading, hfModelsError, hfModelsSummary } from '$lib/stores/appStore';
  import { fetchHFModels } from '$lib/services/api';
  import { processHFModel, getMockModels } from '$lib/utils/modelProcessor';

  let filterText = '';

  function getStatusClass(status: string): string {
    switch (status) {
      case 'Ready':
        return 'text-green-600 bg-green-50';
      case 'Partial':
        return 'text-amber-600 bg-amber-50';
      case 'Blocked':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  function selectModel(key: string) {
    selectedModelKey.set(key);
  }

  async function loadModels() {
    hfModelsLoading.set(true);
    hfModelsError.set(null);

    try {
      const response = await fetchHFModels({ limit: 10, task: 'text-generation' });
      const processed = response.models.map((model, index) => processHFModel(model, index));

      if (processed.length === 0) {
        hfModels.set(getMockModels());
      } else {
        hfModels.set(processed);
        if (processed.length > 0) {
          selectedModelKey.set(processed[0].key);
        }
      }

      if (response.summary?.markdown_report) {
        hfModelsSummary.set(response.summary.markdown_report);
      }
    } catch (error) {
      console.error('Failed to load HF models:', error);
      hfModelsError.set(error instanceof Error ? error.message : 'Failed to load models');
      hfModels.set(getMockModels());
    } finally {
      hfModelsLoading.set(false);
    }
  }

  onMount(() => {
    loadModels();
  });

  $: filteredModels = $hfModels.filter(model =>
    model.name.toLowerCase().includes(filterText.toLowerCase()) ||
    model.author.toLowerCase().includes(filterText.toLowerCase())
  );
</script>

<div class="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-card p-0 flex flex-col h-[560px] overflow-hidden">
  <div class="p-4 border-b border-slate-200 bg-slate-50/30">
    <div class="relative">
      <Search class="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
      <input
        type="text"
        placeholder="Filter models..."
        bind:value={filterText}
        class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 transition-all"
      />
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-2 space-y-1">
    {#if filteredModels.length === 0}
      <div class="flex items-center justify-center h-full">
        <div class="text-sm text-slate-500">No models found</div>
      </div>
    {:else}
      {#each filteredModels as model}
        <button
          on:click={() => selectModel(model.key)}
          class="w-full cursor-pointer p-3 rounded-lg border transition-all flex justify-between items-center group"
          class:bg-white={$selectedModelKey === model.key}
          class:border-slate-200={$selectedModelKey === model.key}
          class:shadow-sm={$selectedModelKey === model.key}
          class:border-transparent={$selectedModelKey !== model.key}
          class:hover:bg-white={$selectedModelKey !== model.key}
          class:hover:shadow-sm={$selectedModelKey !== model.key}
        >
          <div class="flex-1">
            <a
              href={model.url}
              target="_blank"
              rel="noopener noreferrer"
              on:click|stopPropagation
              class="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors text-left block"
            >
              {model.name}
            </a>
            <div class="text-[10px] text-slate-600 mt-1 text-left">❤️ {model.likes}</div>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {model.task}
          </span>
        </button>
      {/each}
    {/if}
  </div>
</div>
