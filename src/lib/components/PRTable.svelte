<script lang="ts">
  import { GitPullRequest, ChevronDown, ChevronUp } from 'lucide-svelte';
  import type { PullRequest } from '$lib/services/api';

  export let prs: PullRequest[] = [];

  let expandedReasoningMap: { [key: number]: boolean } = {};

  function toggleReasoning(prNumber: number) {
    expandedReasoningMap[prNumber] = !expandedReasoningMap[prNumber];
  }

  function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

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
  <div class="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
    <GitPullRequest class="w-3.5 h-3.5 text-purple-500" />
    <h3 class="font-bold text-slate-800 text-[13px]">Pull Request Analysis</h3>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-left">
      <thead class="bg-slate-50 text-[10px] uppercase text-slate-500 font-semibold border-b border-slate-200">
        <tr>
          <th class="px-4 py-2.5 w-16">PR #</th>
          <th class="px-4 py-2.5 min-w-[180px]">Title</th>
          <th class="px-4 py-2.5 w-24">Created</th>
          <th class="px-4 py-2.5 w-16">State</th>
          <th class="px-4 py-2.5 w-20">Hardware</th>
          <th class="px-4 py-2.5 w-28">Type</th>
          <th class="px-4 py-2.5 min-w-[280px]">AI Analysis</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#if prs.length === 0}
          <tr>
            <td colspan="7" class="px-4 py-8 text-center text-xs text-slate-400">
              No pull requests available
            </td>
          </tr>
        {:else}
          {#each prs as pr}
            <tr class="hover:bg-slate-50/70 transition group">
              <td class="px-4 py-3 text-[10px] text-slate-400 font-mono">
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:text-blue-600 transition-colors hover:underline"
                >
                  #{pr.number}
                </a>
              </td>
              <td class="px-4 py-3 text-[13px] font-medium text-slate-800">
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:text-blue-600 transition-colors hover:underline line-clamp-2 leading-snug"
                  title={pr.title}
                >
                  {pr.title}
                </a>
              </td>
              <td class="px-4 py-3 text-[10px] text-slate-500">
                {formatDate(pr.created_at)}
              </td>
              <td class="px-4 py-3">
                <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase {getStateBadgeClass(pr.state)}">
                  {pr.state}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold uppercase">
                  {pr.hardware}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  {#each pr.types as type}
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase {getTypeBadgeClass(type)}">
                      {type}
                    </span>
                  {/each}
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="text-[11px] text-slate-600 leading-relaxed">
                  {#if pr.reasoning.length > 120}
                    <div>
                      <p>
                        {expandedReasoningMap[pr.number] ? pr.reasoning : truncateText(pr.reasoning, 120)}
                      </p>
                      <button
                        on:click={() => toggleReasoning(pr.number)}
                        class="mt-1 text-blue-600 hover:text-blue-700 font-medium text-[10px] flex items-center gap-0.5"
                      >
                        {expandedReasoningMap[pr.number] ? 'Show less' : 'Show more'}
                        {#if expandedReasoningMap[pr.number]}
                          <ChevronUp class="w-3 h-3" />
                        {:else}
                          <ChevronDown class="w-3 h-3" />
                        {/if}
                      </button>
                    </div>
                  {:else}
                    <p>{pr.reasoning}</p>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
