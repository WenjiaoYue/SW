<script lang="ts">
  import { onMount } from 'svelte';
  import { ChevronDown, ChevronUp, Code, AlertCircle, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, Zap, Target, TrendingUp, Cpu, Layers, Box } from 'lucide-svelte';
  import { tritonOps, tritonOpsLoading, tritonOpsError, tritonSubView } from '$lib/stores/appStore';
  import { fetchTritonOps } from '$lib/services/api';
  import type { TritonOp } from '$lib/services/api';
  import LoadingState from './LoadingState.svelte';
  import TritonInsights from './TritonInsights.svelte';

  let expandedOpMap: { [key: string]: boolean } = {};
  let showFilters = false;

  let filters = {
    status: [] as string[],
    category: [] as string[],
    minConfidence: 0,
    hasXPUFunc: null as boolean | null,
  };

  type SortField = 'op_name' | 'confidence' | 'high_level_category' | null;
  type SortDirection = 'asc' | 'desc';

  let sortField: SortField = null;
  let sortDirection: SortDirection = 'desc';

  onMount(async () => {
    if ($tritonOps.length === 0) {
      await loadTritonOps();
    }
  });

  async function loadTritonOps() {
    tritonOpsLoading.set(true);
    tritonOpsError.set(null);

    try {
      const response = await fetchTritonOps();
      tritonOps.set(response.ops);
    } catch (error: any) {
      tritonOpsError.set(error.message || 'Failed to load Triton ops');
    } finally {
      tritonOpsLoading.set(false);
    }
  }

  function toggleOpDetails(opName: string) {
    expandedOpMap[opName] = !expandedOpMap[opName];
  }

  function getStatusBadgeClass(status: string): string {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('cuda_only') || lowerStatus.includes('not')) {
      return 'text-red-700 bg-red-50 border-red-200';
    } else if (lowerStatus.includes('supported') || lowerStatus.includes('both')) {
      return 'text-green-700 bg-green-50 border-green-200';
    } else {
      return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  }

  function getCategoryIcon(category: string) {
    const lower = category.toLowerCase();
    if (lower.includes('matmul') || lower.includes('gemm')) return Layers;
    if (lower.includes('normalization')) return Target;
    if (lower.includes('activation')) return Zap;
    if (lower.includes('attention')) return TrendingUp;
    if (lower.includes('conv')) return Box;
    return Code;
  }

  function getCategoryColor(category: string) {
    const lower = category.toLowerCase();
    if (lower.includes('matmul') || lower.includes('gemm')) return 'from-blue-500 to-blue-600';
    if (lower.includes('normalization')) return 'from-green-500 to-green-600';
    if (lower.includes('activation')) return 'from-orange-500 to-orange-600';
    if (lower.includes('attention')) return 'from-purple-500 to-purple-600';
    if (lower.includes('conv')) return 'from-pink-500 to-pink-600';
    return 'from-slate-500 to-slate-600';
  }

  $: uniqueStatuses = [...new Set($tritonOps.map(op => op.meta.status))];
  $: uniqueCategories = [...new Set($tritonOps.map(op => op.high_level_category))];

  $: stats = {
    total: $tritonOps.length,
    xpuSupported: $tritonOps.filter(op => op.meta.xpu_func !== null).length,
    avgConfidence: $tritonOps.length > 0
      ? Math.round(($tritonOps.reduce((sum, op) => sum + op.confidence, 0) / $tritonOps.length) * 100)
      : 0,
    tritonSupported: $tritonOps.filter(op => op.torch_inductor_triton.toLowerCase() === 'supported').length
  };

  $: filteredOps = (() => {
    let filtered = $tritonOps.filter(op => {
      if (filters.status.length > 0 && !filters.status.includes(op.meta.status)) {
        return false;
      }
      if (filters.category.length > 0 && !filters.category.includes(op.high_level_category)) {
        return false;
      }
      if (op.confidence < filters.minConfidence / 100) {
        return false;
      }
      if (filters.hasXPUFunc !== null) {
        const hasXPU = op.meta.xpu_func !== null;
        if (filters.hasXPUFunc !== hasXPU) {
          return false;
        }
      }
      return true;
    });

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortField === 'op_name' || sortField === 'high_level_category') {
          aValue = a[sortField];
          bValue = b[sortField];
        } else if (sortField === 'confidence') {
          aValue = a.confidence;
          bValue = b.confidence;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (sortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }

    return filtered;
  })();

  function toggleFilter(filterType: 'status' | 'category', value: string) {
    const currentFilters = filters[filterType];
    if (currentFilters.includes(value)) {
      filters[filterType] = currentFilters.filter(v => v !== value);
    } else {
      filters[filterType] = [...currentFilters, value];
    }
  }

  function clearFilters() {
    filters = {
      status: [],
      category: [],
      minConfidence: 0,
      hasXPUFunc: null,
    };
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'desc';
    }
  }

  $: hasActiveFilters = filters.status.length > 0 || filters.category.length > 0 || filters.minConfidence > 0 || filters.hasXPUFunc !== null;

  const loadingSteps = [
    { icon: Code, label: 'Fetching Triton kernel operations...', color: 'text-purple-600' },
    { icon: Code, label: 'Analyzing op compatibility...', color: 'text-blue-600' },
    { icon: Code, label: 'Loading metadata...', color: 'text-green-600' }
  ];
</script>

{#if $tritonSubView === 'insights'}
  <TritonInsights repo="pytorch/pytorch" days={7} maxCommits={5} />
{:else if $tritonOpsLoading}
  <LoadingState
    title="Loading Triton Kernel Operations"
    footerText="Fetching operation definitions and compatibility data. Please wait..."
    steps={loadingSteps}
  />
{:else if $tritonOpsError}
  <div class="flex items-center justify-center h-96">
    <div class="text-center space-y-4 max-w-md">
      <AlertCircle class="w-16 h-16 text-red-500 mx-auto" />
      <h3 class="text-xl font-semibold text-slate-800">Failed to Load Triton Ops</h3>
      <p class="text-slate-600">{$tritonOpsError}</p>
      <button
        on:click={loadTritonOps}
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Retry
      </button>
    </div>
  </div>
{:else}
  <div class="space-y-6 max-w-7xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
        <div class="flex items-center justify-between mb-3">
          <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Code class="w-5 h-5" />
          </div>
          <span class="text-2xl font-bold">{stats.total}</span>
        </div>
        <div class="text-blue-100 text-sm font-medium">Total Operations</div>
      </div>

      <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
        <div class="flex items-center justify-between mb-3">
          <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Cpu class="w-5 h-5" />
          </div>
          <span class="text-2xl font-bold">{stats.xpuSupported}</span>
        </div>
        <div class="text-green-100 text-sm font-medium">XPU Supported</div>
        <div class="mt-2 flex items-center gap-2">
          <div class="flex-1 bg-white/20 rounded-full h-1.5">
            <div class="bg-white rounded-full h-1.5 transition-all" style="width: {stats.total > 0 ? (stats.xpuSupported / stats.total * 100) : 0}%"></div>
          </div>
          <span class="text-xs font-semibold">{stats.total > 0 ? Math.round(stats.xpuSupported / stats.total * 100) : 0}%</span>
        </div>
      </div>

      <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
        <div class="flex items-center justify-between mb-3">
          <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Target class="w-5 h-5" />
          </div>
          <span class="text-2xl font-bold">{stats.avgConfidence}%</span>
        </div>
        <div class="text-purple-100 text-sm font-medium">Avg Confidence</div>
        <div class="mt-2 flex items-center gap-2">
          <div class="flex-1 bg-white/20 rounded-full h-1.5">
            <div class="bg-white rounded-full h-1.5 transition-all" style="width: {stats.avgConfidence}%"></div>
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
        <div class="flex items-center justify-between mb-3">
          <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Zap class="w-5 h-5" />
          </div>
          <span class="text-2xl font-bold">{stats.tritonSupported}</span>
        </div>
        <div class="text-orange-100 text-sm font-medium">Triton Ready</div>
        <div class="mt-2 flex items-center gap-2">
          <div class="flex-1 bg-white/20 rounded-full h-1.5">
            <div class="bg-white rounded-full h-1.5 transition-all" style="width: {stats.total > 0 ? (stats.tritonSupported / stats.total * 100) : 0}%"></div>
          </div>
          <span class="text-xs font-semibold">{stats.total > 0 ? Math.round(stats.tritonSupported / stats.total * 100) : 0}%</span>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Code class="w-4 h-4 text-purple-600" />
          <h3 class="font-bold text-slate-800 text-sm">Operations List</h3>
          <span class="text-xs text-slate-500">({filteredOps.length} of {$tritonOps.length})</span>
        </div>
        <div class="flex items-center gap-2">
          {#if hasActiveFilters}
            <button
              on:click={clearFilters}
              class="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 rounded hover:bg-slate-100 transition"
            >
              <X class="w-3 h-3" />
              Clear filters
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
            class:hover:bg-slate-50={!showFilters}
          >
            <Filter class="w-3.5 h-3.5" />
            Filters
            {#if hasActiveFilters}
              <span class="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                {filters.status.length + filters.category.length + (filters.minConfidence > 0 ? 1 : 0) + (filters.hasXPUFunc !== null ? 1 : 0)}
              </span>
            {/if}
          </button>
        </div>
      </div>

      {#if showFilters}
        <div class="px-4 py-3 bg-slate-50/50 border-b border-slate-200 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label class="text-xs font-semibold text-slate-700 mb-1.5 block">Status</label>
              <div class="flex flex-wrap gap-1.5">
                {#each uniqueStatuses as status}
                  <button
                    on:click={() => toggleFilter('status', status)}
                    class="px-2 py-1 rounded text-[10px] font-medium border transition {filters.status.includes(status) ? getStatusBadgeClass(status) : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
                  >
                    {status}
                  </button>
                {/each}
              </div>
            </div>
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
                class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-700 mb-1.5 block">XPU Function</label>
              <div class="flex gap-1.5">
                <button
                  on:click={() => filters.hasXPUFunc = filters.hasXPUFunc === true ? null : true}
                  class="px-2 py-1 rounded text-[10px] font-medium border transition {filters.hasXPUFunc === true ? 'text-green-700 bg-green-50 border-green-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
                >
                  Has XPU
                </button>
                <button
                  on:click={() => filters.hasXPUFunc = filters.hasXPUFunc === false ? null : false}
                  class="px-2 py-1 rounded text-[10px] font-medium border transition {filters.hasXPUFunc === false ? 'text-red-700 bg-red-50 border-red-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
                >
                  No XPU
                </button>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <div class="p-4">
        {#if filteredOps.length === 0}
          <div class="text-center py-12">
            <Code class="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p class="text-sm text-slate-500">
              {$tritonOps.length === 0 ? 'No operations available' : 'No operations match the current filters'}
            </p>
          </div>
        {:else}
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {#each filteredOps as op}
              {@const CategoryIcon = getCategoryIcon(op.high_level_category)}
              <div class="group relative bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
                <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b {getCategoryColor(op.high_level_category)}"></div>

                <div class="p-4 pl-5">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3 flex-1">
                      <div class="p-2 rounded-lg bg-gradient-to-br {getCategoryColor(op.high_level_category)} text-white flex-shrink-0">
                        <svelte:component this={CategoryIcon} class="w-5 h-5" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <h3 class="font-mono font-bold text-slate-800 text-sm truncate">{op.op_name}</h3>
                        <p class="text-xs text-slate-500 mt-0.5">{op.high_level_category}</p>
                      </div>
                    </div>
                    <button
                      on:click={() => toggleOpDetails(op.op_name)}
                      class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition flex-shrink-0"
                    >
                      {#if expandedOpMap[op.op_name]}
                        <ChevronUp class="w-4 h-4" />
                      {:else}
                        <ChevronDown class="w-4 h-4" />
                      {/if}
                    </button>
                  </div>

                  <div class="flex flex-wrap items-center gap-2 mb-3">
                    <span class="px-2 py-1 rounded text-[10px] font-semibold uppercase border {getStatusBadgeClass(op.meta.status)}">
                      {op.meta.status}
                    </span>
                    {#if op.meta.xpu_func}
                      <span class="px-2 py-1 rounded text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                        XPU ✓
                      </span>
                    {/if}
                    {#if op.torch_inductor_triton.toLowerCase() === 'supported'}
                      <span class="px-2 py-1 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Triton ✓
                      </span>
                    {/if}
                  </div>

                  <div class="space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-slate-600 font-medium">Confidence</span>
                      <span class="font-bold text-slate-800">{(op.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        class="bg-gradient-to-r from-green-400 to-green-600 h-1.5 rounded-full transition-all"
                        style="width: {op.confidence * 100}%"
                      ></div>
                    </div>
                  </div>

                  {#if expandedOpMap[op.op_name]}
                    <div class="mt-4 pt-4 border-t border-slate-200 space-y-3 text-xs">
                      <div>
                        <span class="font-semibold text-slate-700 block mb-1.5">Description</span>
                        <p class="text-slate-600 leading-relaxed">{op.description}</p>
                      </div>

                      <div class="grid grid-cols-2 gap-2">
                        <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <span class="font-semibold text-slate-700 block mb-1 text-[10px]">TorchInductor</span>
                          <span class="font-mono text-[10px] {op.torch_inductor_triton.toLowerCase() === 'supported' ? 'text-green-600' : 'text-slate-600'}">
                            {op.torch_inductor_triton}
                          </span>
                        </div>
                        <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <span class="font-semibold text-slate-700 block mb-1 text-[10px]">Backend</span>
                          <span class="font-mono text-[10px] text-slate-600">{op.backend_hint}</span>
                        </div>
                      </div>

                      <div class="bg-blue-50 rounded-lg p-2 border border-blue-200">
                        <span class="font-semibold text-slate-700 block mb-1 text-[10px]">Triton Pattern</span>
                        <code class="font-mono text-[10px] text-blue-700">{op.likely_triton_pattern}</code>
                      </div>

                      <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
                        <span class="font-semibold text-slate-700 block mb-1.5 text-[10px]">Function Signature</span>
                        <code class="text-[9px] text-slate-600 block overflow-x-auto">{op.meta.func_signature}</code>
                      </div>

                      {#if op.official_triton.summary}
                        <div class="bg-purple-50 rounded-lg p-2 border border-purple-200">
                          <span class="font-semibold text-slate-700 block mb-1 text-[10px]">Official Triton</span>
                          <p class="text-slate-600 text-[10px] leading-relaxed">{op.official_triton.summary}</p>
                        </div>
                      {/if}

                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <span class="font-semibold text-slate-600 block mb-1 text-[10px]">CUDA Function</span>
                          <span class="font-mono text-[9px] {op.meta.cuda_func ? 'text-green-600' : 'text-slate-400'}">
                            {op.meta.cuda_func || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span class="font-semibold text-slate-600 block mb-1 text-[10px]">XPU Function</span>
                          <span class="font-mono text-[9px] {op.meta.xpu_func ? 'text-green-600' : 'text-red-500'}">
                            {op.meta.xpu_func || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {#if op.meta.dispatches && Object.keys(op.meta.dispatches).length > 0}
                        <div>
                          <span class="font-semibold text-slate-700 block mb-1.5 text-[10px]">Dispatches</span>
                          <div class="flex flex-wrap gap-1.5">
                            {#each Object.entries(op.meta.dispatches) as [backend, func]}
                              <span class="px-1.5 py-0.5 rounded text-[8px] bg-slate-100 text-slate-700 border border-slate-200">
                                <span class="font-semibold">{backend}</span>
                              </span>
                            {/each}
                          </div>
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
