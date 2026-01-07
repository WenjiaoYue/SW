<script lang="ts">
  import { FileText, BarChart2 } from 'lucide-svelte';
  import { marked } from 'marked';
  import TopicsChart from './TopicsChart.svelte';
  import CommitTable from './CommitTable.svelte';
  import PRTable from './PRTable.svelte';
  import { repoData } from '$lib/stores/dataStore';
  import { HOT_TOPICS_MD } from '$lib/data/constants';

  let activeTab: 'report' | 'chart' = 'report';

  function switchTab(tab: 'report' | 'chart') {
    activeTab = tab;
  }

  $: summaryText = $repoData?.summary || HOT_TOPICS_MD;
  $: renderedMarkdown = marked.parse(summaryText);
</script>

<div class="space-y-6 max-w-[1400px] mx-auto transition-opacity duration-300">
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div class="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-card flex flex-col h-[520px] overflow-hidden">
      <div class="px-6 pt-5 border-b border-slate-200 flex gap-6">
        <button
          on:click={() => switchTab('report')}
          class="tab-btn flex items-center gap-2"
          class:active={activeTab === 'report'}
        >
          <FileText class="w-4 h-4" />
          Insights
        </button>
        <button
          on:click={() => switchTab('chart')}
          class="tab-btn flex items-center gap-2"
          class:active={activeTab === 'chart'}
        >
          <BarChart2 class="w-4 h-4" />
          Hot Topics
        </button>
      </div>

      <div class="flex-1 relative bg-white">
        <div
          class="absolute inset-0 p-6 flex flex-col transition-opacity duration-300"
          class:opacity-0={activeTab !== 'chart'}
          class:pointer-events-none={activeTab !== 'chart'}
        >
          <div class="mb-4">
            <h3 class="text-base font-bold text-slate-800">Weekly Development Focus</h3>
            <p class="text-xs text-slate-600 mt-1">Click a bar to filter commits on the right.</p>
          </div>
          <TopicsChart />
        </div>

        <div
          class="absolute inset-0 p-6 overflow-y-auto transition-opacity duration-300"
          class:opacity-0={activeTab !== 'report'}
          class:pointer-events-none={activeTab !== 'report'}
        >
          <div class="markdown-content">
            {@html renderedMarkdown}
          </div>
        </div>
      </div>
    </div>

    <CommitTable />
  </div>

  <PRTable />
</div>
