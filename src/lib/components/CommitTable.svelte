<script lang="ts">
  import { GitCommit } from 'lucide-svelte';
  import { commitFilter } from '$lib/stores/appStore';
  import { COMMITS } from '$lib/data/constants';

  $: filteredCommits = $commitFilter === 'All'
    ? COMMITS
    : COMMITS.filter((c) => c.cat === $commitFilter);

  function getCategoryColor(category: string): string {
    switch (category) {
      case 'Pallas':
        return 'bg-blue-500';
      case 'ROCm':
        return 'bg-cyan-500';
      case 'Inductor':
        return 'bg-violet-500';
      default:
        return 'bg-slate-300';
    }
  }

  function resetFilter() {
    commitFilter.set('All');
  }
</script>

<div class="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-card flex flex-col h-[520px] overflow-hidden">
  <div class="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
    <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
      <GitCommit class="text-blue-600 w-4 h-4" />
      Recent Commits
      <span class="bg-slate-200 text-xs px-1.5 rounded-full text-slate-600">
        {filteredCommits.length}
      </span>
    </h3>
    <button
      on:click={resetFilter}
      class="text-xs text-slate-600 hover:text-blue-600 transition px-2 py-1 rounded hover:bg-white"
    >
      Reset Filter
    </button>
  </div>

  <div class="flex-1 overflow-y-auto">
    <table class="w-full text-left">
      <tbody class="text-xs divide-y divide-slate-50">
        {#if filteredCommits.length === 0}
          <tr>
            <td colspan="3" class="p-4 text-center text-xs text-slate-400">
              No commits found for {$commitFilter}
            </td>
          </tr>
        {:else}
          {#each filteredCommits as commit}
            <tr class="hover:bg-slate-50 transition cursor-default group border-b border-slate-50 last:border-0">
              <td class="px-5 py-3 w-4">
                <div class="w-1.5 h-1.5 rounded-full {getCategoryColor(commit.cat)}"></div>
              </td>
              <td class="px-2 py-3 font-mono text-[11px] text-blue-600 w-16 opacity-70 group-hover:opacity-100">
                {commit.hash}
              </td>
              <td class="px-2 py-3 text-xs text-slate-800 font-medium truncate max-w-[200px]">
                {commit.msg}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
