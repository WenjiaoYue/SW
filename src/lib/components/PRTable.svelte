<script lang="ts">
  import { GitPullRequest } from 'lucide-svelte';
  import type { PullRequest } from '$lib/services/api';

  export let prs: PullRequest[] = [];

  function getTypeBadgeClass(type: string): string {
    const lowerType = type.toLowerCase();
    if (lowerType === 'feature' || lowerType === 'enhancement') {
      return 'text-blue-600 bg-blue-50 border-blue-100';
    } else if (lowerType === 'bugfix' || lowerType === 'bug') {
      return 'text-red-600 bg-red-50 border-red-100';
    } else if (lowerType === 'refactor') {
      return 'text-purple-600 bg-purple-50 border-purple-100';
    } else {
      return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  }

  function getStateBadgeClass(state: string): string {
    const lowerState = state.toLowerCase();
    if (lowerState === 'open') {
      return 'text-green-600 bg-green-50 border-green-100';
    } else if (lowerState === 'closed') {
      return 'text-red-600 bg-red-50 border-red-100';
    } else if (lowerState === 'merged') {
      return 'text-purple-600 bg-purple-50 border-purple-100';
    } else {
      return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
          <th class="px-6 py-3 min-w-[200px]">Title</th>
          <th class="px-6 py-3 w-32">Created</th>
          <th class="px-6 py-3 w-20">State</th>
          <th class="px-6 py-3 w-24">Hardware</th>
          <th class="px-6 py-3 w-32">Type</th>
          <th class="px-6 py-3 min-w-[300px]">AI Reasoning</th>
        </tr>
      </thead>
      <tbody class="text-sm divide-y divide-slate-200">
        {#if prs.length === 0}
          <tr>
            <td colspan="7" class="px-6 py-8 text-center text-slate-400">
              No pull requests available
            </td>
          </tr>
        {:else}
          {#each prs as pr}
            <tr class="hover:bg-slate-50 transition group">
              <td class="px-6 py-4 text-xs text-slate-400 font-mono">
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:text-blue-600 transition-colors hover:underline"
                >
                  #{pr.number}
                </a>
              </td>
              <td class="px-6 py-4 text-sm font-medium text-slate-800">
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:text-blue-600 transition-colors hover:underline"
                >
                  {pr.title}
                </a>
              </td>
              <td class="px-6 py-4 text-xs text-slate-500">
                {formatDate(pr.created_at)}
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-md text-[10px] font-bold uppercase border {getStateBadgeClass(pr.state)}">
                  {pr.state}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase border border-slate-200">
                  {pr.hardware}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  {#each pr.types as type}
                    <span class="px-2 py-1 rounded-md text-[10px] font-bold uppercase border {getTypeBadgeClass(type)}">
                      {type}
                    </span>
                  {/each}
                </div>
              </td>
              <td class="px-6 py-4 text-xs text-slate-600">
                {pr.reasoning}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
