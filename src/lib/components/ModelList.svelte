<script lang="ts">
  import { Search } from 'lucide-svelte';
  import { selectedModelKey } from '$lib/stores/appStore';
  import { MODEL_DATA } from '$lib/data/constants';

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
</script>

<div class="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-card p-0 flex flex-col h-[560px] overflow-hidden">
  <div class="p-4 border-b border-slate-200 bg-slate-50/30">
    <div class="relative">
      <Search class="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
      <input
        type="text"
        placeholder="Filter models..."
        class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 transition-all"
      />
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-2 space-y-1">
    {#each Object.entries(MODEL_DATA) as [key, model]}
      <button
        on:click={() => selectModel(key)}
        class="w-full cursor-pointer p-3 rounded-lg border transition-all flex justify-between items-center group"
        class:bg-white={$selectedModelKey === key}
        class:border-slate-200={$selectedModelKey === key}
        class:shadow-sm={$selectedModelKey === key}
        class:border-transparent={$selectedModelKey !== key}
        class:hover:bg-white={$selectedModelKey !== key}
        class:hover:shadow-sm={$selectedModelKey !== key}
      >
        <div>
          <div class="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-left">
            {model.name}
          </div>
          <div class="text-[10px] text-slate-600 mt-1 text-left">❤️ {model.likes}</div>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded font-bold {getStatusClass(model.status)}">
          {model.status}
        </span>
      </button>
    {/each}
  </div>
</div>
