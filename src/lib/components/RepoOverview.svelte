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
            class="absolute inset-0 p-5 overflow-y-auto transition-opacity duration-300"
            class:opacity-0={activeTab !== 'report'}
            class:pointer-events-none={activeTab !== 'report'}
          >
            <div class="markdown-content text-[13px]">
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
