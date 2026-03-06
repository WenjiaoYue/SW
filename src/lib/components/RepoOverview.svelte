<script lang="ts">
  import { FileText, BarChart2 } from 'lucide-svelte';
  import { marked } from 'marked';
  import TopicsChart from './TopicsChart.svelte';
  import CommitTable from './CommitTable.svelte';
  import PRTable from './PRTable.svelte';
  import LoadingState from './LoadingState.svelte';
  import EmptyState from './EmptyState.svelte';
  import { repoData, isLoadingData } from '$lib/stores/dataStore';

  let activeTab: 'report' | 'chart' = 'report';

  function switchTab(tab: 'report' | 'chart') {
    activeTab = tab;
  }

  $: summaryText = $repoData?.summary || '';
  $: renderedMarkdown = summaryText ? marked.parse(summaryText) : '';
  $: pullRequests = $repoData?.prs_analysis || [];
</script>

{#if $isLoadingData}
  <LoadingState />
{:else if !$repoData}
  <EmptyState />
{:else}
  <div class="space-y-5 max-w-[1400px] mx-auto transition-opacity duration-300">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div class="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-card flex flex-col h-[520px] overflow-hidden">
        <div class="px-5 pt-4 border-b border-slate-200 flex gap-4">
          <button
            on:click={() => switchTab('report')}
            class="tab-btn flex items-center gap-1.5 text-[13px]"
            class:active={activeTab === 'report'}
          >
            <FileText class="w-3.5 h-3.5" />
            Insights
          </button>
          <button
            on:click={() => switchTab('chart')}
            class="tab-btn flex items-center gap-1.5 text-[13px]"
            class:active={activeTab === 'chart'}
          >
            <BarChart2 class="w-3.5 h-3.5" />
            Hot Topics
          </button>
        </div>

        <div class="flex-1 relative bg-white">
          <div
            class="absolute inset-0 p-5 flex flex-col transition-opacity duration-300"
            class:opacity-0={activeTab !== 'chart'}
            class:pointer-events-none={activeTab !== 'chart'}
          >
            <div class="mb-3">
              <h3 class="text-sm font-bold text-slate-800">Weekly Development Focus</h3>
              <p class="text-[11px] text-slate-500 mt-1">Click a bar to filter commits on the right.</p>
            </div>
            <TopicsChart />
          </div>

          <div
            class="absolute inset-0 px-6 py-5 overflow-y-auto transition-opacity duration-300"
            class:opacity-0={activeTab !== 'report'}
            class:pointer-events-none={activeTab !== 'report'}
          >
            <div class="markdown-content text-[13px] leading-6 text-slate-700">
              {@html renderedMarkdown}
            </div>
          </div>
        </div>
      </div>

      <CommitTable />
    </div>

    <PRTable prs={pullRequests} />
  </div>
{/if}

<style>
  .markdown-content :global(h1),
  .markdown-content :global(h2),
  .markdown-content :global(h3),
  .markdown-content :global(h4) {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    line-height: 1.35;
    color: #0f172a;
    font-weight: 700;
  }

  .markdown-content :global(h1) {
    font-size: 1.1rem;
  }

  .markdown-content :global(h2) {
    font-size: 1rem;
  }

  .markdown-content :global(h3),
  .markdown-content :global(h4) {
    font-size: 0.95rem;
  }

  .markdown-content :global(p) {
    margin: 0.7rem 0;
    line-height: 1.7;
  }

  .markdown-content :global(ul),
  .markdown-content :global(ol) {
    margin: 0.7rem 0 0.9rem;
    padding-left: 1.2rem;
  }

  .markdown-content :global(li) {
    margin: 0.3rem 0;
    line-height: 1.65;
  }

  .markdown-content :global(blockquote) {
    margin: 0.9rem 0;
    padding: 0.55rem 0.85rem;
    border-left: 3px solid #cbd5e1;
    background: #f8fafc;
    color: #334155;
    border-radius: 0.35rem;
  }

  .markdown-content :global(pre) {
    margin: 0.85rem 0;
    padding: 0.75rem 0.85rem;
    border-radius: 0.5rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    overflow-x: auto;
  }

  .markdown-content :global(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 0.82em;
  }

  .markdown-content :global(p code),
  .markdown-content :global(li code) {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 0.25rem;
    padding: 0.05rem 0.28rem;
  }
</style>
