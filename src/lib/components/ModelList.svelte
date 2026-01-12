<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, Cpu } from 'lucide-svelte';
  import { selectedModelKey, hfModels, hfModelsLoading, hfModelsError, hfModelsSummary, hfModelsLoaded } from '$lib/stores/appStore';
  import { fetchHFModels } from '$lib/services/api';
  import { processHFModel, getMockModels } from '$lib/utils/modelProcessor';

  let filterText = '';

  function getStatusClass(status: string): string {
    if (!status) return 'text-slate-600 bg-slate-50 border-slate-200';

    const statusLower = status.toLowerCase();

    if (statusLower.includes('support') && !statusLower.includes('not') && !statusLower.includes('un')) {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    if (statusLower.includes('partial') || statusLower.includes('likely') || statusLower.includes('limited')) {
      return 'text-amber-600 bg-amber-50 border-amber-200';
    }
    if (statusLower.includes('unclear') || statusLower.includes('unknown')) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    }
    if (statusLower.includes('not') || statusLower.includes('block') || statusLower.includes('unsupport')) {
      return 'text-red-600 bg-red-50 border-red-200';
    }

    return 'text-slate-600 bg-slate-50 border-slate-200';
  }

  function selectModel(key: string) {
    selectedModelKey.set(key);
  }

  function getXPUStatus(model: any): string {
    if (!model.rawData?.xpu) return '';
    return model.rawData.xpu.status;
  }

  async function loadModels() {
    let isLoaded = false;
    const unsubscribe = hfModelsLoaded.subscribe(value => isLoaded = value);
    unsubscribe();

    if (isLoaded) return;

    hfModelsLoading.set(true);
    hfModelsError.set(null);

    try {
      const response = await fetchHFModels({ limit: 10, task: 'text-generation' });

      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response format from API');
      }

      const processed = response.data.map((model, index) => processHFModel(model, index));

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

      hfModelsLoaded.set(true);
    } catch (error) {
      console.error('Failed to load HF models:', error);
      hfModelsError.set(error instanceof Error ? error.message : 'Failed to load models');
      hfModelsLoaded.set(true);
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
          class="w-full cursor-pointer p-3 rounded-lg border transition-all group text-left"
          class:bg-white={$selectedModelKey === model.key}
          class:border-slate-200={$selectedModelKey === model.key}
          class:shadow-sm={$selectedModelKey === model.key}
          class:border-transparent={$selectedModelKey !== model.key}
          class:hover:bg-white={$selectedModelKey !== model.key}
          class:hover:shadow-sm={$selectedModelKey !== model.key}
        >
          <div class="flex items-start gap-2">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold text-slate-800 truncate">
                {model.name}
              </div>
              <div class="text-[10px] text-slate-500 truncate mt-0.5">by {model.author}</div>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <div class="text-[10px] text-slate-600">❤️ {model.likes}</div>
                <div class="text-[10px] text-slate-600">⬇️ {model.downloads}</div>
                {#if getXPUStatus(model)}
                  <div class="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded border {getStatusClass(getXPUStatus(model))}">
                    <Cpu class="w-2.5 h-2.5" />
                    <span class="font-bold">XPU</span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </button>
      {/each}
    {/if}
  </div>
</div>
