<script lang="ts">
  import { onMount } from 'svelte';
  import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Code, AlertCircle, Sparkles, Brain, Layers, Settings, Filter, X, Target, Zap, TrendingUp, Box, FileText } from 'lucide-svelte';
  import { tritonInsights, tritonInsightsLoading, tritonInsightsError } from '$lib/stores/appStore';
  import { fetchTritonInsights } from '$lib/services/api';
  import type { TritonInsight } from '$lib/services/api';
  import LoadingState from './LoadingState.svelte';
  import { marked } from 'marked';

  export let repo = 'pytorch/pytorch';
  export let days = 7;
  export let maxCommits = 5;

  let expandedOpMap: { [key: string]: boolean } = {};
  let activeTab: { [key: string]: 'torch' | 'inductor' | 'triton' | 'raw' } = {};
  let showFilters = false;
  let currentPage = 1;
  let itemsPerPage = 10;

  let filters = {
    category: [] as string[],
    minConfidence: 0,
    hasLowering: null as boolean | null,
    search: ''
  };

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

  function toggleOpDetails(op: string) {
    expandedOpMap[op] = !expandedOpMap[op];
    if (!activeTab[op]) {
      activeTab[op] = 'torch';
    }
  }

  function setActiveTab(op: string, tab: 'torch' | 'inductor' | 'triton' | 'raw') {
    activeTab[op] = tab;
  }

  function renderMarkdown(markdown: string): string {
    return marked(markdown || '') as string;
  }

  function parseInsights(markdown: string) {
    const result: any = {};
    if (!markdown) return result;

    const lines = markdown.split('\n');
    for (const line of lines) {
      if (line.includes('**High level category:**')) {
        result.category = line.split('**High level category:**')[1]?.trim();
      }
      if (line.includes('**Backend hint:**')) {
        result.backend = line.split('**Backend hint:**')[1]?.trim();
      }
      if (line.includes('**Likely triton pattern:**')) {
        result.pattern = line.split('**Likely triton pattern:**')[1]?.trim();
      }
      if (line.includes('**Description:**')) {
        result.description = line.split('**Description:**')[1]?.trim();
      }
      if (line.includes('**Confidence:**')) {
        result.confidence = line.split('**Confidence:**')[1]?.trim();
      }
      if (line.includes('**Has inductor lowering:**')) {
        result.hasLowering = line.split('**Has inductor lowering:**')[1]?.trim();
      }
      if (line.includes('**Triton backend support:**')) {
        result.support = line.split('**Triton backend support:**')[1]?.trim();
      }
      if (line.includes('**Op name:**')) {
        result.opName = line.split('**Op name:**')[1]?.trim();
      }
      if (line.includes('**Alignment note:**')) {
        result.alignmentNote = line.split('**Alignment note:**')[1]?.trim();
      }
    }

    let summaryIndex = markdown.indexOf('**Summary:**');
    if (summaryIndex !== -1) {
      let nextSectionIndex = markdown.indexOf('\n## ', summaryIndex);
      if (nextSectionIndex === -1) {
        nextSectionIndex = markdown.indexOf('\n- **', summaryIndex);
      }
      if (nextSectionIndex === -1) {
        nextSectionIndex = markdown.indexOf('\n### ', summaryIndex);
      }
      if (nextSectionIndex > summaryIndex) {
        result.summary = markdown.substring(summaryIndex + 13, nextSectionIndex).trim();
      } else {
        result.summary = markdown.substring(summaryIndex + 13).trim();
      }
    }

    const evidenceMatch = markdown.match(/## Evidence\n([\s\S]*?)(?=\n##|\n###|$)/);
    if (evidenceMatch) {
      const evidenceSection = evidenceMatch[1];
      result.snippets = evidenceSection.split('\n')
        .filter(l => l.trim().startsWith('-'))
        .map(l => l.trim().substring(1).trim());
    } else {
      const snippetSection = markdown.split('**Snippets:**')[1];
      if (snippetSection) {
        result.snippets = snippetSection.split('\n')
          .filter(l => l.trim().startsWith('-'))
          .map(l => l.trim().substring(1).trim());
      } else {
        result.snippets = [];
      }
    }

    return result;
  }

  function getCategoryIcon(category: string) {
    const lower = (category || '').toLowerCase();
    if (lower.includes('matmul') || lower.includes('gemm')) return Layers;
    if (lower.includes('normalization')) return Target;
    if (lower.includes('activation')) return Zap;
    if (lower.includes('attention')) return TrendingUp;
    if (lower.includes('conv')) return Box;
    return Code;
  }

  function getCategoryColor(category: string) {
    const lower = (category || '').toLowerCase();
    if (lower.includes('matmul') || lower.includes('gemm')) return 'from-blue-500 to-blue-600';
    if (lower.includes('normalization')) return 'from-green-500 to-green-600';
    if (lower.includes('activation')) return 'from-orange-500 to-orange-600';
    if (lower.includes('attention')) return 'from-purple-500 to-purple-600';
    if (lower.includes('conv')) return 'from-pink-500 to-pink-600';
    return 'from-slate-500 to-slate-600';
  }

  function toggleFilter(filterType: 'category', value: string) {
    const currentFilters = filters[filterType];
    if (currentFilters.includes(value)) {
      filters[filterType] = currentFilters.filter(v => v !== value);
    } else {
      filters[filterType] = [...currentFilters, value];
    }
    currentPage = 1;
  }

  function clearFilters() {
    filters = {
      category: [],
      minConfidence: 0,
      hasLowering: null,
      search: ''
    };
    currentPage = 1;
  }

  $: uniqueCategories = [...new Set($tritonInsights.map(insight => {
    const torchData = parseInsights(insight.torch_op_insights);
    return torchData.category;
  }).filter(Boolean))];

  $: filteredInsights = (() => {
    let filtered = $tritonInsights.filter(insight => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!insight.op.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      const torchData = parseInsights(insight.torch_op_insights);
      const inductorData = parseInsights(insight.torch_inductor_insights);

      if (filters.category.length > 0) {
        if (!filters.category.includes(torchData.category)) {
          return false;
        }
      }

      if (filters.minConfidence > 0) {
        const confidence = parseFloat(torchData.confidence || '0');
        if (confidence < filters.minConfidence / 100) {
          return false;
        }
      }

      if (filters.hasLowering !== null) {
        const hasLowering = inductorData.hasLowering === 'True';
        if (filters.hasLowering !== hasLowering) {
          return false;
        }
      }

      return true;
    });

    return filtered;
  })();

  $: totalPages = Math.ceil(filteredInsights.length / itemsPerPage);
  $: paginatedInsights = filteredInsights.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  $: hasActiveFilters = filters.category.length > 0 || filters.minConfidence > 0 || filters.hasLowering !== null || filters.search;

  function goToPage(page: number) {
    currentPage = Math.max(1, Math.min(page, totalPages));
  }

  const loadingSteps = [
    { icon: Code, label: 'Analyzing repository commits...', color: 'text-blue-600' },
    { icon: Brain, label: 'Processing Triton insights...', color: 'text-orange-600' },
    { icon: Sparkles, label: 'Generating reports...', color: 'text-green-600' }
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
  <div class="space-y-6 max-w-7xl mx-auto">
    <div class="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <Sparkles class="w-5 h-5 text-blue-600" />
              <h3 class="font-bold text-slate-800">Triton Insights</h3>
            </div>
            <p class="text-xs text-slate-600">
              Analysis of {$tritonInsights.length} operations from <span class="font-mono font-semibold">{repo}</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            {#if hasActiveFilters}
              <button
                on:click={clearFilters}
                class="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 rounded hover:bg-slate-100 transition"
              >
                <X class="w-3 h-3" />
                Clear
              </button>
            {/if}
            <button
              on:click={() => showFilters = !showFilters}
              class="px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center gap-1.5"
              class:bg-blue-50={showFilters}
              class:border-blue-200={showFilters}
              class:text-blue-700={showFilters}
              class:bg-white={!showFilters}
              class:border-slate-200={!showFilters}
              class:text-slate-600={!showFilters}
            >
              <Filter class="w-3.5 h-3.5" />
              Filters
              {#if hasActiveFilters}
                <span class="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                  {filters.category.length + (filters.minConfidence > 0 ? 1 : 0) + (filters.hasLowering !== null ? 1 : 0) + (filters.search ? 1 : 0)}
                </span>
              {/if}
            </button>
            <button
              on:click={loadTritonInsights}
              class="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {#if showFilters}
          <div class="space-y-3 pt-3 border-t border-slate-200">
            <div>
              <label class="text-xs font-semibold text-slate-700 mb-1.5 block">Search Operation</label>
              <input
                type="text"
                bind:value={filters.search}
                placeholder="Search by operation name..."
                class="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                on:input={() => currentPage = 1}
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="text-xs font-semibold text-slate-700 mb-1.5 block">Category</label>
                <div class="flex flex-wrap gap-1.5">
                  {#each uniqueCategories as category}
                    <button
                      on:click={() => toggleFilter('category', category)}
                      class="px-2 py-1 rounded text-[10px] font-medium border transition {filters.category.includes(category) ? 'text-blue-700 bg-blue-50 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
                    >
                      {category}
                    </button>
                  {/each}
                </div>
              </div>

              <div>
                <label class="text-xs font-semibold text-slate-700 mb-1.5 block">Min Confidence: {filters.minConfidence}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  bind:value={filters.minConfidence}
                  class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  on:input={() => currentPage = 1}
                />
              </div>

              <div>
                <label class="text-xs font-semibold text-slate-700 mb-1.5 block">Inductor Lowering</label>
                <div class="flex gap-1.5">
                  <button
                    on:click={() => { filters.hasLowering = filters.hasLowering === true ? null : true; currentPage = 1; }}
                    class="px-2 py-1 rounded text-[10px] font-medium border transition {filters.hasLowering === true ? 'text-green-700 bg-green-50 border-green-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
                  >
                    Has Lowering
                  </button>
                  <button
                    on:click={() => { filters.hasLowering = filters.hasLowering === false ? null : false; currentPage = 1; }}
                    class="px-2 py-1 rounded text-[10px] font-medium border transition {filters.hasLowering === false ? 'text-red-700 bg-red-50 border-red-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
                  >
                    No Lowering
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <div class="p-5">
        {#if filteredInsights.length === 0}
          <div class="text-center py-12">
            <Code class="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p class="text-sm text-slate-500">
              {$tritonInsights.length === 0 ? 'No insights available' : 'No operations match the current filters'}
            </p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each paginatedInsights as insight}
              {@const torchData = parseInsights(insight.torch_op_insights)}
              {@const inductorData = parseInsights(insight.torch_inductor_insights)}
              {@const tritonData = parseInsights(insight.triton_insights)}
              {@const CategoryIcon = getCategoryIcon(torchData.category)}

              <div class="group relative bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
                <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b {getCategoryColor(torchData.category)}"></div>

                <div class="p-4 pl-5">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3 flex-1">
                      <div class="p-2 rounded-lg bg-gradient-to-br {getCategoryColor(torchData.category)} text-white flex-shrink-0">
                        <svelte:component this={CategoryIcon} class="w-4 h-4" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <h3 class="font-mono font-bold text-slate-800 text-sm">{insight.op}</h3>
                        <div class="flex items-center gap-2 mt-1 flex-wrap">
                          {#if torchData.category}
                            <span class="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 font-medium">
                              {torchData.category}
                            </span>
                          {/if}
                          {#if torchData.backend}
                            <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {torchData.backend}
                            </span>
                          {/if}
                          {#if torchData.confidence}
                            <span class="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200 font-semibold">
                              {torchData.confidence}
                            </span>
                          {/if}
                          {#if inductorData.hasLowering === 'True'}
                            <span class="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 font-semibold">
                              Has Lowering
                            </span>
                          {/if}
                        </div>
                      </div>
                    </div>
                    <button
                      on:click={() => toggleOpDetails(insight.op)}
                      class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition flex-shrink-0"
                    >
                      {#if expandedOpMap[insight.op]}
                        <ChevronUp class="w-4 h-4" />
                      {:else}
                        <ChevronDown class="w-4 h-4" />
                      {/if}
                    </button>
                  </div>

                  {#if expandedOpMap[insight.op]}
                    <div class="mt-4 pt-4 border-t border-slate-200">
                      <div class="flex gap-2 mb-4 border-b border-slate-200 overflow-x-auto">
                        <button
                          on:click={() => setActiveTab(insight.op, 'torch')}
                          class="px-4 py-2 text-xs font-medium transition relative whitespace-nowrap"
                          class:text-orange-600={activeTab[insight.op] === 'torch'}
                          class:text-slate-500={activeTab[insight.op] !== 'torch'}
                        >
                          <div class="flex items-center gap-1.5">
                            <Brain class="w-3.5 h-3.5" />
                            Torch Op
                          </div>
                          {#if activeTab[insight.op] === 'torch'}
                            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                          {/if}
                        </button>
                        <button
                          on:click={() => setActiveTab(insight.op, 'inductor')}
                          class="px-4 py-2 text-xs font-medium transition relative whitespace-nowrap"
                          class:text-blue-600={activeTab[insight.op] === 'inductor'}
                          class:text-slate-500={activeTab[insight.op] !== 'inductor'}
                        >
                          <div class="flex items-center gap-1.5">
                            <Layers class="w-3.5 h-3.5" />
                            Inductor
                          </div>
                          {#if activeTab[insight.op] === 'inductor'}
                            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                          {/if}
                        </button>
                        <button
                          on:click={() => setActiveTab(insight.op, 'triton')}
                          class="px-4 py-2 text-xs font-medium transition relative whitespace-nowrap"
                          class:text-green-600={activeTab[insight.op] === 'triton'}
                          class:text-slate-500={activeTab[insight.op] !== 'triton'}
                        >
                          <div class="flex items-center gap-1.5">
                            <Settings class="w-3.5 h-3.5" />
                            Triton
                          </div>
                          {#if activeTab[insight.op] === 'triton'}
                            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"></div>
                          {/if}
                        </button>
                        <button
                          on:click={() => setActiveTab(insight.op, 'raw')}
                          class="px-4 py-2 text-xs font-medium transition relative whitespace-nowrap"
                          class:text-slate-700={activeTab[insight.op] === 'raw'}
                          class:text-slate-500={activeTab[insight.op] !== 'raw'}
                        >
                          <div class="flex items-center gap-1.5">
                            <FileText class="w-3.5 h-3.5" />
                            Raw Markdown
                          </div>
                          {#if activeTab[insight.op] === 'raw'}
                            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700"></div>
                          {/if}
                        </button>
                      </div>

                      <div class="space-y-3 text-xs">
                        {#if activeTab[insight.op] === 'torch'}
                          {#if torchData.description}
                            <div>
                              <span class="font-semibold text-slate-700 block mb-1.5">Description</span>
                              <p class="text-slate-600 leading-relaxed">{torchData.description}</p>
                            </div>
                          {/if}
                          <div class="grid grid-cols-2 gap-2">
                            {#if torchData.pattern}
                              <div class="bg-blue-50 rounded-lg p-2 border border-blue-200">
                                <span class="font-semibold text-slate-700 block mb-1 text-[10px]">Triton Pattern</span>
                                <code class="text-[10px] text-blue-700 font-mono">{torchData.pattern}</code>
                              </div>
                            {/if}
                            {#if torchData.backend}
                              <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
                                <span class="font-semibold text-slate-700 block mb-1 text-[10px]">Backend</span>
                                <span class="text-[10px] text-slate-600">{torchData.backend}</span>
                              </div>
                            {/if}
                          </div>
                        {/if}

                        {#if activeTab[insight.op] === 'inductor'}
                          {#if inductorData.summary}
                            <div>
                              <span class="font-semibold text-slate-700 block mb-1.5">Summary</span>
                              <p class="text-slate-600 leading-relaxed">{inductorData.summary}</p>
                            </div>
                          {/if}
                          <div class="grid grid-cols-2 gap-2">
                            {#if inductorData.hasLowering}
                              <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
                                <span class="font-semibold text-slate-700 block mb-1 text-[10px]">Has Lowering</span>
                                <span class="font-mono text-[10px]" class:text-green-600={inductorData.hasLowering === 'True'} class:text-red-600={inductorData.hasLowering === 'False'}>
                                  {inductorData.hasLowering}
                                </span>
                              </div>
                            {/if}
                            {#if inductorData.support}
                              <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
                                <span class="font-semibold text-slate-700 block mb-1 text-[10px]">Backend Support</span>
                                <span class="text-[10px] text-slate-600">{inductorData.support}</span>
                              </div>
                            {/if}
                          </div>
                          {#if inductorData.snippets && inductorData.snippets.length > 0}
                            <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
                              <span class="font-semibold text-slate-700 block mb-1.5 text-[10px]">Evidence</span>
                              <ul class="space-y-1">
                                {#each inductorData.snippets as snippet}
                                  <li class="text-[10px] text-slate-600 leading-relaxed">• {snippet}</li>
                                {/each}
                              </ul>
                            </div>
                          {/if}
                        {/if}

                        {#if activeTab[insight.op] === 'triton'}
                          {#if tritonData.alignmentNote}
                            <div>
                              <span class="font-semibold text-slate-700 block mb-1.5">Alignment Note</span>
                              <p class="text-slate-600 leading-relaxed">{tritonData.alignmentNote}</p>
                            </div>
                          {/if}
                          <div class="grid grid-cols-2 gap-2">
                            {#if tritonData.category}
                              <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
                                <span class="font-semibold text-slate-700 block mb-1 text-[10px]">Category</span>
                                <span class="text-[10px] text-slate-600">{tritonData.category}</span>
                              </div>
                            {/if}
                            {#if tritonData.pattern}
                              <div class="bg-blue-50 rounded-lg p-2 border border-blue-200">
                                <span class="font-semibold text-slate-700 block mb-1 text-[10px]">Pattern</span>
                                <code class="text-[10px] text-blue-700 font-mono">{tritonData.pattern}</code>
                              </div>
                            {/if}
                          </div>
                          {#if tritonData.confidence}
                            <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
                              <span class="font-semibold text-slate-700 block mb-1 text-[10px]">Confidence Score</span>
                              <span class="text-[10px] text-slate-800 font-bold">{tritonData.confidence}</span>
                            </div>
                          {/if}
                        {/if}

                        {#if activeTab[insight.op] === 'raw'}
                          <div class="space-y-4">
                            {#if insight.torch_op_insights}
                              <div class="bg-orange-50/50 rounded-lg p-3 border border-orange-200">
                                <div class="flex items-center gap-2 mb-2">
                                  <Brain class="w-4 h-4 text-orange-600" />
                                  <span class="font-semibold text-slate-700 text-xs">Torch Op Insights</span>
                                </div>
                                <div class="prose prose-xs max-w-none prose-slate">
                                  {@html renderMarkdown(insight.torch_op_insights)}
                                </div>
                              </div>
                            {/if}

                            {#if insight.torch_inductor_insights}
                              <div class="bg-blue-50/50 rounded-lg p-3 border border-blue-200">
                                <div class="flex items-center gap-2 mb-2">
                                  <Layers class="w-4 h-4 text-blue-600" />
                                  <span class="font-semibold text-slate-700 text-xs">Torch Inductor Insights</span>
                                </div>
                                <div class="prose prose-xs max-w-none prose-slate">
                                  {@html renderMarkdown(insight.torch_inductor_insights)}
                                </div>
                              </div>
                            {/if}

                            {#if insight.triton_insights}
                              <div class="bg-green-50/50 rounded-lg p-3 border border-green-200">
                                <div class="flex items-center gap-2 mb-2">
                                  <Settings class="w-4 h-4 text-green-600" />
                                  <span class="font-semibold text-slate-700 text-xs">Triton Insights</span>
                                </div>
                                <div class="prose prose-xs max-w-none prose-slate">
                                  {@html renderMarkdown(insight.triton_insights)}
                                </div>
                              </div>
                            {/if}
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>

          {#if totalPages > 1}
            <div class="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
              <div class="text-xs text-slate-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredInsights.length)} of {filteredInsights.length}
              </div>
              <div class="flex items-center gap-2">
                <button
                  on:click={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  class="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>
                <div class="flex gap-1">
                  {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                    return start + i;
                  }) as page}
                    <button
                      on:click={() => goToPage(page)}
                      class="px-3 py-1.5 text-xs font-medium rounded-lg border transition"
                      class:bg-blue-600={currentPage === page}
                      class:text-white={currentPage === page}
                      class:border-blue-600={currentPage === page}
                      class:bg-white={currentPage !== page}
                      class:border-slate-200={currentPage !== page}
                      class:hover:bg-slate-50={currentPage !== page}
                    >
                      {page}
                    </button>
                  {/each}
                </div>
                <button
                  on:click={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  class="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
