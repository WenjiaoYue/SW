<script lang="ts">
  import { onMount } from 'svelte';
  import { Code, CircleAlert as AlertCircle, Sparkles, Brain, Copy, Check, ChevronDown, ChevronUp } from 'lucide-svelte';
  import { tritonInsights, tritonInsightsLoading, tritonInsightsError } from '$lib/stores/appStore';
  import { fetchTritonInsights } from '$lib/services/api';
  import LoadingState from './LoadingState.svelte';
  import Pagination from './Pagination.svelte';
  import { marked } from 'marked';

  export let repo = 'pytorch/pytorch';
  export let days = 7;
  export let maxCommits = 5;

  let activeTab: { [key: string]: 'summary' | 'results' | 'kernel' | 'test_kernel' | 'source_code' } = {};
  let copiedCodeMap: { [key: string]: boolean } = {};
  let expandedCards: { [key: string]: boolean } = {};
  let currentPage = 1;
  let itemsPerPage = 10;
  let searchQuery = '';

  onMount(async () => {
    await loadTritonInsights();
  });

  async function loadTritonInsights() {
    tritonInsightsLoading.set(true);
    tritonInsightsError.set(null);

    try {
      const response = await fetchTritonInsights({
        repo,
        days,
        max_commits: maxCommits
      });
      tritonInsights.set(response.data);
    } catch (error: any) {
      tritonInsightsError.set(error.message || 'Failed to load Triton insights');
    } finally {
      tritonInsightsLoading.set(false);
    }
  }

  function setActiveTab(insightKey: string, tab: 'summary' | 'results' | 'kernel' | 'test_kernel' | 'source_code') {
    activeTab[insightKey] = tab;
  }

  function toggleCard(insightKey: string) {
    expandedCards[insightKey] = !expandedCards[insightKey];
  }

  function cleanDisplayValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    const text = String(value).trim();
    if (!text) return '';
    const lower = text.toLowerCase();
    if (lower === 'undefined' || lower === 'null' || lower === 'none') return '';
    return text;
  }

  function extractSourceName(sourceCode: unknown): string {
    const content = cleanDisplayValue(sourceCode);
    if (!content) return '';
    const firstLine = content.split('\n')[0]?.trim() || '';
    const match = firstLine.match(/^#\s*(.+)$/);
    return match ? match[1].trim() : '';
  }

  function stripSourceHeader(sourceCode: unknown): string {
    const content = cleanDisplayValue(sourceCode);
    if (!content) return '';

    const lines = content.split('\n');
    const firstLine = lines[0]?.trim() || '';
    if (firstLine.match(/^#\s*(.+)$/)) {
      return lines.slice(1).join('\n').replace(/^\n+/, '').trimEnd();
    }
    return content;
  }

  function getInsightDisplayName(insight: any): string {
    const sourceName = extractSourceName(insight?.source_code);
    return sourceName || 'Triton Insight';
  }

  async function copyCode(text: unknown, key: string) {
    const content = cleanDisplayValue(text);
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      copiedCodeMap = { ...copiedCodeMap, [key]: true };
      setTimeout(() => {
        copiedCodeMap = { ...copiedCodeMap, [key]: false };
      }, 1400);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }

  function renderMarkdown(markdown: string): string {
    return marked(markdown || '') as string;
  }

  $: filteredInsights = $tritonInsights.filter(insight => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const displayName = getInsightDisplayName(insight).toLowerCase();
    const summary = (insight.summary || '').toLowerCase();
    return displayName.includes(searchLower) || summary.includes(searchLower);
  });

  $: totalPages = Math.ceil(filteredInsights.length / itemsPerPage);
  $: paginatedInsights = filteredInsights.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  function handlePageChange(page: number) {
    currentPage = page;
  }

  function handleItemsPerPageChange(newItemsPerPage: number) {
    itemsPerPage = newItemsPerPage;
    currentPage = 1;
  }

  const loadingSteps = [
    { icon: Code, label: 'Analyzing repository commits...', color: 'text-slate-600' },
    { icon: Brain, label: 'Processing Triton insights...', color: 'text-slate-600' },
    { icon: Sparkles, label: 'Generating reports...', color: 'text-slate-600' }
  ];
</script>

{#if $tritonInsightsLoading}
  <LoadingState
    title="Analyzing Triton Insights"
    footerText="Processing commits and generating insights. This may take a moment..."
    steps={loadingSteps}
  />
{:else if $tritonInsightsError}
  <div class="flex items-center justify-center h-96">
    <div class="text-center space-y-4 max-w-md">
      <AlertCircle class="w-16 h-16 text-red-500 mx-auto" />
      <h3 class="text-xl font-semibold text-slate-800">Failed to Load Insights</h3>
      <p class="text-slate-600">{$tritonInsightsError}</p>
      <button
        on:click={loadTritonInsights}
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Retry
      </button>
    </div>
  </div>
{:else}
  <div class="space-y-6">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div class="flex items-center gap-4 mb-6">
        <input
          type="text"
          bind:value={searchQuery}
          on:input={() => currentPage = 1}
          placeholder="Search by operation name or summary..."
          class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
        />
        <div class="flex items-center gap-2 text-sm whitespace-nowrap">
          <span class="text-slate-500">Total:</span>
          <span class="font-semibold text-slate-800">{filteredInsights.length}</span>
        </div>
      </div>

      {#if filteredInsights.length === 0}
        <div class="text-center py-12">
          <Code class="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p class="text-sm text-slate-500">
            {$tritonInsights.length === 0 ? 'No insights available' : 'No operations match your search'}
          </p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each paginatedInsights as insight, insightIndex}
            {@const displayName = getInsightDisplayName(insight)}
            {@const insightKey = `${displayName}-${(currentPage - 1) * itemsPerPage + insightIndex}`}
            {@const currentTab = activeTab[insightKey] ?? 'summary'}
            {@const isExpanded = expandedCards[insightKey] ?? true}

            <div class="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-all bg-white">
              <button
                on:click={() => toggleCard(insightKey)}
                class="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div class="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex-shrink-0">
                  <Code class="w-5 h-5" />
                </div>

                <div class="flex-1 text-left">
                  <h3 class="font-semibold text-slate-800 text-sm">{displayName}</h3>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {isExpanded ? 'Click to collapse' : 'Click to expand'}
                  </p>
                </div>

                <div class="text-slate-400">
                  {#if isExpanded}
                    <ChevronUp class="w-5 h-5" />
                  {:else}
                    <ChevronDown class="w-5 h-5" />
                  {/if}
                </div>
              </button>

              {#if isExpanded}
                <div class="px-4 pb-4 border-t border-slate-100">
                  <div class="mt-3 pt-3 border-t border-slate-200">
                    <div class="flex gap-2 mb-3 border-b border-slate-200 overflow-x-auto">
                      <button
                        on:click={() => setActiveTab(insightKey, 'summary')}
                        class="px-3 py-2 text-xs font-medium transition relative whitespace-nowrap rounded-t-md"
                        class:text-blue-600={currentTab === 'summary'}
                        class:bg-blue-50={currentTab === 'summary'}
                        class:text-slate-600={currentTab !== 'summary'}
                      >
                        Summary
                        {#if currentTab === 'summary'}
                          <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                        {/if}
                      </button>
                      <button
                        on:click={() => setActiveTab(insightKey, 'results')}
                        class="px-3 py-2 text-xs font-medium transition relative whitespace-nowrap rounded-t-md"
                        class:text-emerald-600={currentTab === 'results'}
                        class:bg-emerald-50={currentTab === 'results'}
                        class:text-slate-600={currentTab !== 'results'}
                      >
                        Results
                        {#if currentTab === 'results'}
                          <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
                        {/if}
                      </button>
                      <button
                        on:click={() => setActiveTab(insightKey, 'kernel')}
                        class="px-3 py-2 text-xs font-medium transition relative whitespace-nowrap rounded-t-md"
                        class:text-orange-600={currentTab === 'kernel'}
                        class:bg-orange-50={currentTab === 'kernel'}
                        class:text-slate-600={currentTab !== 'kernel'}
                      >
                        Kernel
                        {#if currentTab === 'kernel'}
                          <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                        {/if}
                      </button>
                      <button
                        on:click={() => setActiveTab(insightKey, 'test_kernel')}
                        class="px-3 py-2 text-xs font-medium transition relative whitespace-nowrap rounded-t-md"
                        class:text-violet-600={currentTab === 'test_kernel'}
                        class:bg-violet-50={currentTab === 'test_kernel'}
                        class:text-slate-600={currentTab !== 'test_kernel'}
                      >
                        Test Kernel
                        {#if currentTab === 'test_kernel'}
                          <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600"></div>
                        {/if}
                      </button>
                      <button
                        on:click={() => setActiveTab(insightKey, 'source_code')}
                        class="px-3 py-2 text-xs font-medium transition relative whitespace-nowrap rounded-t-md"
                        class:text-slate-700={currentTab === 'source_code'}
                        class:bg-slate-50={currentTab === 'source_code'}
                        class:text-slate-600={currentTab !== 'source_code'}
                      >
                        Source Code
                        {#if currentTab === 'source_code'}
                          <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700"></div>
                        {/if}
                      </button>
                    </div>

                    <div class="text-sm">
                      {#if currentTab === 'summary'}
                        <div class="prose prose-xs max-w-none prose-slate prose-p:text-[11px] prose-li:text-[11px] prose-headings:text-xs prose-code:text-[10px] prose-pre:text-[10px] bg-blue-50/30 p-4 rounded-lg border border-blue-100">
                          {@html renderMarkdown(insight.summary)}
                        </div>
                      {/if}
                      {#if currentTab === 'results'}
                        <div class="prose prose-xs max-w-none prose-slate prose-p:text-[10px] prose-li:text-[10px] prose-headings:text-[11px] prose-code:text-[9px] prose-pre:text-[9px] prose-p:leading-5 prose-li:leading-5 bg-emerald-50/30 p-3 rounded-lg border border-emerald-100">
                          {@html renderMarkdown(insight.results)}
                        </div>
                      {/if}
                      {#if currentTab === 'kernel'}
                        {@const kernelCode = cleanDisplayValue(insight.kernel)}
                        {@const kernelKey = `${insightKey}-kernel`}
                        <div class="relative max-w-none">
                          <button
                            on:click={() => copyCode(kernelCode, kernelKey)}
                            disabled={!kernelCode}
                            class="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded border transition"
                            class:bg-slate-800={copiedCodeMap[kernelKey]}
                            class:text-white={copiedCodeMap[kernelKey]}
                            class:border-slate-700={copiedCodeMap[kernelKey]}
                            class:bg-slate-100={!copiedCodeMap[kernelKey]}
                            class:text-slate-700={!copiedCodeMap[kernelKey]}
                            class:border-slate-300={!copiedCodeMap[kernelKey]}
                            class:opacity-40={!kernelCode}
                            class:cursor-not-allowed={!kernelCode}
                          >
                            {#if copiedCodeMap[kernelKey]}
                              <Check class="w-3 h-3" />
                              Copied
                            {:else}
                              <Copy class="w-3 h-3" />
                              Copy
                            {/if}
                          </button>
                          <pre class="bg-slate-900/80 text-slate-100 border border-slate-700 p-3 pr-20 rounded text-[11px] leading-5 overflow-x-auto font-mono">{kernelCode || 'No kernel content'}</pre>
                        </div>
                      {/if}
                      {#if currentTab === 'test_kernel'}
                        {@const testKernelCode = cleanDisplayValue(insight.test_kernel)}
                        {@const testKernelKey = `${insightKey}-test_kernel`}
                        <div class="relative max-w-none">
                          <button
                            on:click={() => copyCode(testKernelCode, testKernelKey)}
                            disabled={!testKernelCode}
                            class="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded border transition"
                            class:bg-slate-800={copiedCodeMap[testKernelKey]}
                            class:text-white={copiedCodeMap[testKernelKey]}
                            class:border-slate-700={copiedCodeMap[testKernelKey]}
                            class:bg-slate-100={!copiedCodeMap[testKernelKey]}
                            class:text-slate-700={!copiedCodeMap[testKernelKey]}
                            class:border-slate-300={!copiedCodeMap[testKernelKey]}
                            class:opacity-40={!testKernelCode}
                            class:cursor-not-allowed={!testKernelCode}
                          >
                            {#if copiedCodeMap[testKernelKey]}
                              <Check class="w-3 h-3" />
                              Copied
                            {:else}
                              <Copy class="w-3 h-3" />
                              Copy
                            {/if}
                          </button>
                          <pre class="bg-slate-900/80 text-slate-100 border border-slate-700 p-3 pr-20 rounded text-[11px] leading-5 overflow-x-auto font-mono">{testKernelCode || 'No test kernel content'}</pre>
                        </div>
                      {/if}
                      {#if currentTab === 'source_code'}
                        {@const sourceCode = stripSourceHeader(insight.source_code)}
                        {@const sourceCodeKey = `${insightKey}-source_code`}
                        <div class="relative max-w-none">
                          <button
                            on:click={() => copyCode(sourceCode, sourceCodeKey)}
                            disabled={!sourceCode}
                            class="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded border transition"
                            class:bg-slate-800={copiedCodeMap[sourceCodeKey]}
                            class:text-white={copiedCodeMap[sourceCodeKey]}
                            class:border-slate-700={copiedCodeMap[sourceCodeKey]}
                            class:bg-slate-100={!copiedCodeMap[sourceCodeKey]}
                            class:text-slate-700={!copiedCodeMap[sourceCodeKey]}
                            class:border-slate-300={!copiedCodeMap[sourceCodeKey]}
                            class:opacity-40={!sourceCode}
                            class:cursor-not-allowed={!sourceCode}
                          >
                            {#if copiedCodeMap[sourceCodeKey]}
                              <Check class="w-3 h-3" />
                              Copied
                            {:else}
                              <Copy class="w-3 h-3" />
                              Copy
                            {/if}
                          </button>
                          <pre class="bg-slate-900/80 text-slate-100 border border-slate-700 p-3 pr-20 rounded text-[11px] leading-5 overflow-x-auto font-mono">{sourceCode || 'No source code content'}</pre>
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        {#if filteredInsights.length > 0}
          <div class="mt-4">
            <Pagination
              {currentPage}
              totalItems={filteredInsights.length}
              {itemsPerPage}
              on:pageChange={(e) => handlePageChange(e.detail)}
              on:itemsPerPageChange={(e) => handleItemsPerPageChange(e.detail)}
            />
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
