<script lang="ts">
  import { GitCommit, ExternalLink } from 'lucide-svelte';
  import { commitFilter } from '$lib/stores/appStore';
  import { repoData } from '$lib/stores/dataStore';
  import type { Commit } from '$lib/services/api';
  import { COMMITS, CHART_COLORS } from '$lib/data/constants';

  interface DisplayCommit {
    hash: string;
    msg: string;
    cat: string;
    url?: string;
    topicName?: string;
    reasoning?: string;
    authorName?: string;
    authorLogin?: string;
    date?: string;
  }

  $: displayCommits = $repoData?.commits
    ? $repoData.commits.map(c => ({
        hash: c.sha.substring(0, 7),
        msg: c.commit_info.message.split('\n')[0],
        cat: c.topic_name || c.primary_topic_id || 'Other',
        url: c.commit_info.url,
        topicName: c.topic_name,
        reasoning: c.reasoning,
        authorName: c.commit_info.author_name,
        authorLogin: c.commit_info.author_login,
        date: new Date(c.commit_info.commit_date).toLocaleDateString()
      }))
    : COMMITS.map(c => ({
        hash: c.hash,
        msg: c.msg,
        cat: c.cat,
      }));

  $: filteredCommits = $commitFilter === 'All'
    ? displayCommits
    : displayCommits.filter((c) => c.cat.toLowerCase().includes($commitFilter.toLowerCase()));

  $: topicColorMap = (() => {
    if (!$repoData?.topics || $repoData.topics.length === 0) {
      return new Map<string, string>();
    }

    const sortedTopics = [...$repoData.topics]
      .sort((a, b) => b.commit_count - a.commit_count)
      .slice(0, 5);

    const map = new Map<string, string>();
    sortedTopics.forEach((topic, index) => {
      map.set(topic.name, CHART_COLORS[index] || '#94a3b8');
    });

    return map;
  })();

  function getCategoryColor(category: string): string {
    return topicColorMap.get(category) || '#94a3b8';
  }

  function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  function resetFilter() {
    commitFilter.set('All');
  }

  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    <div class="divide-y divide-slate-100">
      {#if filteredCommits.length === 0}
        <div class="p-6 text-center text-xs text-slate-400">
          No commits found for {$commitFilter}
        </div>
      {:else}
        {#each filteredCommits as commit}
          <div class="hover:bg-slate-50/70 transition group px-4 py-3">
            <div class="flex items-start gap-3">
              <div class="mt-1 flex-shrink-0">
                <div class="w-2 h-2 rounded-full shadow-sm" style="background-color: {getCategoryColor(commit.cat)}"></div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3 mb-1.5">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span class="font-mono text-[11px] text-blue-600 font-semibold">{commit.hash}</span>
                      {#if commit.date}
                        <span class="text-[10px] text-slate-400 font-medium">{commit.date}</span>
                      {/if}
                      {#if commit.authorLogin}
                        <span class="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                          @{commit.authorLogin}
                        </span>
                      {/if}
                    </div>

                    <p class="text-xs text-slate-900 font-medium mb-1.5 leading-relaxed">
                      {commit.msg}
                    </p>

                    {#if commit.reasoning}
                      <div class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 mb-1.5">
                        <p class="text-[11px] text-slate-600 leading-relaxed" title={commit.reasoning}>
                          <span class="font-semibold text-slate-700">Analysis:</span> {truncateText(commit.reasoning, 120)}
                        </p>
                      </div>
                    {/if}

                    {#if commit.topicName}
                      <div class="inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md font-medium border"
                           style="background-color: {getCategoryColor(commit.topicName)}15; color: {getCategoryColor(commit.topicName)}; border-color: {getCategoryColor(commit.topicName)}30;">
                        <div class="w-1.5 h-1.5 rounded-full" style="background-color: {getCategoryColor(commit.topicName)}"></div>
                        {commit.topicName}
                      </div>
                    {/if}
                  </div>

                  {#if commit.url}
                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex-shrink-0 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title="View on GitHub"
                    >
                      <ExternalLink class="w-3.5 h-3.5" />
                    </a>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
