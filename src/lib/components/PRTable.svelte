<script lang="ts">
  import { GitPullRequest } from 'lucide-svelte';
  import { PRS } from '$lib/data/constants';

  function getTypeBadgeClass(type: string): string {
    return type === 'Feature'
      ? 'text-blue-600 bg-blue-50 border-blue-100'
      : 'text-red-600 bg-red-50 border-red-100';
  }
</script>

<div class="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
  <div class="px-6 py-4 border-b border-slate-200 bg-slate-50/30 flex items-center gap-2">
    <GitPullRequest class="w-4 h-4 text-purple-500" />
    <h3 class="font-bold text-slate-800 text-sm">Pull Request Analysis</h3>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-left">
      <thead class="bg-slate-50 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-200">
        <tr>
          <th class="px-6 py-3 w-20">PR #</th>
          <th class="px-6 py-3 min-w-[250px]">Title</th>
          <th class="px-6 py-3 w-24">Hardware</th>
          <th class="px-6 py-3 w-24">Type</th>
          <th class="px-6 py-3 min-w-[350px]">AI Reasoning</th>
        </tr>
      </thead>
      <tbody class="text-sm divide-y divide-slate-200">
        {#each PRS as pr}
          <tr class="hover:bg-slate-50 transition group">
            <td class="px-6 py-4 text-xs text-slate-400 font-mono group-hover:text-blue-600 transition-colors">
              #{pr.id}
            </td>
            <td class="px-6 py-4 text-sm font-medium text-slate-800">
              {pr.title}
            </td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase border border-slate-200">
                {pr.hw}
              </span>
            </td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 rounded-md text-[10px] font-bold uppercase border {getTypeBadgeClass(pr.type)}">
                {pr.type}
              </span>
            </td>
            <td class="px-6 py-4 text-xs text-slate-600">
              {pr.reason}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
