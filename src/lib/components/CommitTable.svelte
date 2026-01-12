<script lang="ts">
  import { GitPullRequest, ExternalLink } from 'lucide-svelte';
  import { commitFilter } from '$lib/stores/appStore';
  import { repoData } from '$lib/stores/dataStore';
  import type { RecentPR } from '$lib/services/api';
  import { CHART_COLORS } from '$lib/data/constants';

  $: prs = $repoData?.prs || [];

  $: filteredPRs = $commitFilter === 'All'
    ? prs
    : prs.filter((pr) => pr.topic_name.toLowerCase().includes($commitFilter.toLowerCase()));

  $: topicColorMap = (() => {
    if (!$repoData?.topics || $repoData.topics.length === 0) {
      return new Map<string, string>();
    }

    const sortedTopics = [...$repoData.topics]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const map = new Map<string, string>();
    sortedTopics.forEach((topic, index) => {
      map.set(topic.topic_name, CHART_COLORS[index] || '#94a3b8');
    });

    return map;
  })();

  function getCategoryColor(category: string): string {
    return topicColorMap.get(category) || '#94a3b8';
  }

  function resetFilter() {
    commitFilter.set('All');
  }
</script>

<div class="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-card flex flex-col h-[520px] overflow-hidden">
  <div class="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
    <h3 class="font-bold text-slate-800 text-[13px] flex items-center gap-2">
      <GitPullRequest class="text-blue-600 w-3.5 h-3.5" />
      Recent Pull Requests
      <span class="bg-slate-200 text-[10px] px-1.5 py-0.5 rounded-full text-slate-600 font-semibold">
        {filteredPRs.length}
      </span>
    </h3>
    <button
      on:click={resetFilter}
      class="text-[11px] text-slate-600 hover:text-blue-600 transition px-2 py-1 rounded hover:bg-white font-medium"
    >
      Reset Filter
    </button>
  </div>

  <div class="flex-1 overflow-y-auto">
    <div class="divide-y divide-slate-100">
      {#if filteredPRs.length === 0}
        <div class="p-6 text-center text-xs text-slate-400">
          No pull requests found for {$commitFilter}
        </div>
      {:else}
        {#each filteredPRs as pr}
          <div class="hover:bg-slate-50/70 transition group px-4 py-3.5">
            <div class="flex items-start gap-3">
              <div class="mt-1.5 flex-shrink-0">
                <div class="w-2 h-2 rounded-full shadow-sm" style="background-color: {getCategoryColor(pr.topic_name)}"></div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0 space-y-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-mono text-[10px] text-blue-600 font-semibold">#{pr.number}</span>
                      <span class="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-semibold"
                           style="background-color: {getCategoryColor(pr.topic_name)}20; color: {getCategoryColor(pr.topic_name)};">
                        <div class="w-1 h-1 rounded-full" style="background-color: {getCategoryColor(pr.topic_name)}"></div>
                        {pr.topic_name}
                      </span>
                    </div>

                    <p class="text-[13px] text-slate-900 font-medium leading-snug">
                      {pr.title}
                    </p>
                  </div>

                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex-shrink-0 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="View on GitHub"
                  >
                    <ExternalLink class="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
