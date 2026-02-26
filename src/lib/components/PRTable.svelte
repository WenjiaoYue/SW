<script lang="ts">
  import { GitPullRequest, ChevronDown, ChevronUp, Filter, X, Cpu, Tag, User, FileText, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Code } from 'lucide-svelte';
  import type { PullRequest } from '$lib/services/api';

  export let prs: PullRequest[] = [];

  let expandedPRMap: { [key: number]: boolean } = {};
  let expandedOpMap: { [key: string]: boolean } = {};
  let showFilters = false;

  let filters = {
    hardware: [] as string[],
    state: [] as string[],
    types: [] as string[],
    minRelevanceScore: 0,
    maxRelevanceScore: 100,
  };

  function handleMinChange() {
    filters.minRelevanceScore = Math.min(filters.minRelevanceScore, filters.maxRelevanceScore);
  }

  function handleMaxChange() {
    filters.maxRelevanceScore = Math.max(filters.maxRelevanceScore, filters.minRelevanceScore);
  }

  function handleTrackClick(event: MouseEvent) {
    const track = event.currentTarget as HTMLElement;
    const rect = track.getBoundingClientRect();
    const percent = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const val = Math.round(percent);

    const { minRelevanceScore: min, maxRelevanceScore: max } = filters;

    if (min === 0 && max === 100) {
      filters.minRelevanceScore = val;
    } else {
      const distMin = Math.abs(val - min);
      const distMax = Math.abs(val - max);

      if (distMin < distMax) {
        filters.minRelevanceScore = val;
      } else {
        filters.maxRelevanceScore = val;
      }
    }

    if (filters.minRelevanceScore > filters.maxRelevanceScore) {
       const temp = filters.minRelevanceScore;
       filters.minRelevanceScore = filters.maxRelevanceScore;
       filters.maxRelevanceScore = temp;
    }
  }

  $: rangeStyle = `left: ${filters.minRelevanceScore}%; right: ${100 - filters.maxRelevanceScore}%;`;

  type SortField = 'xpu_relevance_score' | 'number' | 'created_at' | null;
  type SortDirection = 'asc' | 'desc';

  let sortField: SortField = null;
  let sortDirection: SortDirection = 'desc';

  let currentPage = 1;
  let itemsPerPage = 10;

  function togglePRDetails(prNumber: number) {
    expandedPRMap[prNumber] = !expandedPRMap[prNumber];
  }

  function toggleOpDetails(prNumber: number, opName: string) {
    const key = `${prNumber}-${opName}`;
    expandedOpMap[key] = !expandedOpMap[key];
  }

  function isOpExpanded(prNumber: number, opName: string): boolean {
    const key = `${prNumber}-${opName}`;
    return expandedOpMap[key] || false;
  }

  function getStatusBadgeClass(status: string): string {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('cuda_only') || lowerStatus.includes('not')) {
      return 'text-red-700 bg-red-50 border-red-200';
    } else if (lowerStatus.includes('supported')) {
      return 'text-green-700 bg-green-50 border-green-200';
    } else {
      return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  }

  function getTypeBadgeClass(type: string): string {
    const lowerType = type.toLowerCase();
    if (lowerType === 'feature' || lowerType === 'enhancement') {
      return 'text-blue-700 bg-blue-50 border-blue-200';
    } else if (lowerType === 'bugfix' || lowerType === 'bug') {
      return 'text-red-700 bg-red-50 border-red-200';
    } else if (lowerType === 'refactor') {
      return 'text-amber-700 bg-amber-50 border-amber-200';
    } else if (lowerType === 'test') {
      return 'text-green-700 bg-green-50 border-green-200';
    } else if (lowerType === 'infra') {
      return 'text-slate-700 bg-slate-50 border-slate-200';
    } else {
      return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  }

  function getStateBadgeClass(state: string): string {
    const lowerState = state.toLowerCase();
    if (lowerState === 'open') {
      return 'text-green-700 bg-green-50 border-green-200';
    } else if (lowerState === 'closed') {
      return 'text-red-700 bg-red-50 border-red-200';
    } else if (lowerState === 'merged') {
      return 'text-purple-700 bg-purple-50 border-purple-200';
    } else {
      return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  }

  function getHardwareBadgeClass(hardware: string): string {
    const lowerHardware = hardware.toLowerCase();
    if (lowerHardware === 'xpu') {
      return 'text-cyan-700 bg-cyan-50 border-cyan-200 font-semibold';
    } else if (lowerHardware === 'cuda' || lowerHardware === 'gpu') {
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    } else if (lowerHardware === 'cpu') {
      return 'text-blue-700 bg-blue-50 border-blue-200';
    } else {
      return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  }

  function getXPUScoreBadgeClass(score: number): string {
    if (score >= 8) {
      return 'text-red-700 bg-red-50 border-red-300';
    } else if (score >= 5) {
      return 'text-orange-700 bg-orange-50 border-orange-300';
    } else if (score >= 3) {
      return 'text-amber-700 bg-amber-50 border-amber-300';
    } else if (score > 0) {
      return 'text-blue-700 bg-blue-50 border-blue-300';
    } else {
      return 'text-slate-600 bg-slate-50 border-slate-200';
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

  $: uniqueHardware = [...new Set(prs.map(pr => pr.hardware))];
  $: uniqueStates = [...new Set(prs.map(pr => pr.state))];
  $: uniqueTypes = [...new Set(prs.flatMap(pr => pr.types))];

  $: allFilteredPRs = (() => {
    let filtered = prs.filter(pr => {
      if (filters.hardware.length > 0 && !filters.hardware.includes(pr.hardware)) {
        return false;
      }
      if (filters.state.length > 0 && !filters.state.includes(pr.state)) {
        return false;
      }
      if (filters.types.length > 0 && !pr.types.some(type => filters.types.includes(type))) {
        return false;
      }
      if (pr.xpu_relevance_score < filters.minRelevanceScore || pr.xpu_relevance_score > filters.maxRelevanceScore) {
        return false;
      }
      return true;
    });

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortField === 'xpu_relevance_score' || sortField === 'number') {
          aValue = a[sortField];
          bValue = b[sortField];
        } else if (sortField === 'created_at') {
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
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

  $: totalPages = Math.ceil(allFilteredPRs.length / itemsPerPage);

  $: {
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    }
    if (currentPage < 1) {
      currentPage = 1;
    }
  }

  $: filteredPRs = allFilteredPRs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  function toggleFilter(filterType: 'hardware' | 'state' | 'types', value: string) {
    const currentFilters = filters[filterType];
    if (currentFilters.includes(value)) {
      filters[filterType] = currentFilters.filter(v => v !== value);
    } else {
      filters[filterType] = [...currentFilters, value];
    }
  }

  function clearFilters() {
    filters = {
      hardware: [],
      state: [],
      types: [],
      minRelevanceScore: 0,
      maxRelevanceScore: 100,
    };
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = field === 'created_at' ? 'desc' : 'desc';
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
    }
  }

  function previousPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }

  $: hasActiveFilters = filters.hardware.length > 0 || filters.state.length > 0 || filters.types.length > 0 || filters.minRelevanceScore > 0 || filters.maxRelevanceScore < 100;

  $: pageNumbers = (() => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1);
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1);
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push(-1);
        pages.push(totalPages);
      }
    }

    return pages;
  })();
</script>

<div class="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
  <div class="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <GitPullRequest class="w-4 h-4 text-blue-600" />
      <h3 class="font-bold text-slate-800 text-sm">Pull Request Analysis</h3>
      <span class="text-xs text-slate-500">({allFilteredPRs.length} of {prs.length})</span>
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
            {filters.hardware.length + filters.state.length + filters.types.length + (filters.minRelevanceScore > 0 || filters.maxRelevanceScore < 100 ? 1 : 0)}
          </span>
        {/if}
      </button>
    </div>
  </div>

  {#if showFilters}
    <div class="px-4 py-3 bg-slate-50/50 border-b border-slate-200 space-y-3">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label class="text-xs font-semibold text-slate-700 mb-1.5 block">Hardware</label>
          <div class="flex flex-wrap gap-1.5">
            {#each uniqueHardware as hw}
              <button
                on:click={() => toggleFilter('hardware', hw)}
                class="px-2 py-1 rounded text-[10px] font-medium border transition {filters.hardware.includes(hw) ? getHardwareBadgeClass(hw) : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
              >
                {hw}
              </button>
            {/each}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold text-slate-700 mb-1.5 block">State</label>
          <div class="flex flex-wrap gap-1.5">
            {#each uniqueStates as st}
              <button
                on:click={() => toggleFilter('state', st)}
                class="px-2 py-1 rounded text-[10px] font-medium border transition {filters.state.includes(st) ? getStateBadgeClass(st) : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
              >
                {st}
              </button>
            {/each}
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold text-slate-700 mb-1.5 block">Type</label>
          <div class="flex flex-wrap gap-1.5">
            {#each uniqueTypes as type}
              <button
                on:click={() => toggleFilter('types', type)}
                class="px-2 py-1 rounded text-[10px] font-medium border transition {filters.types.includes(type) ? getTypeBadgeClass(type) : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}"
              >
                {type}
              </button>
            {/each}
          </div>
        </div>
        
        <div>
          <div class="flex justify-between items-center mb-1.5 whitespace-nowrap">
            <div class="flex items-center gap-2">
              <label class="text-xs font-semibold text-slate-700">Relevance Score</label>
              <span class="text-[10px] text-slate-500 font-medium">({allFilteredPRs.length} matches)</span>
            </div>
            <span class="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 rounded whitespace-nowrap">
              {filters.minRelevanceScore} - {filters.maxRelevanceScore}
            </span>
          </div>
          
          <div 
            class="relative h-4 w-full flex items-center cursor-pointer"
            on:click={handleTrackClick}
          >
            <div class="absolute w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"></div>
            
            <div 
              class="absolute h-1.5 bg-blue-600 rounded-full"
              style={rangeStyle}
            ></div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              bind:value={filters.minRelevanceScore}
              on:input={handleMinChange}
              class="absolute top-0 w-full h-full appearance-none bg-transparent pointer-events-none z-10 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-slate-300 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-slate-300 [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:cursor-pointer"
            />
            
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              bind:value={filters.maxRelevanceScore}
              on:input={handleMaxChange}
              class="absolute top-0 w-full h-full appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-slate-300 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-slate-300 [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  {/if}

  <div class="overflow-x-auto">
    <table class="w-full text-left">
      <thead class="bg-slate-50 text-[10px] uppercase text-slate-500 font-semibold border-b border-slate-200">
        <tr>
          <th class="px-3 py-2.5 w-12">
            <button
              on:click={() => toggleSort('xpu_relevance_score')}
              class="flex items-center gap-1 hover:text-slate-700 transition group"
            >
              <span>Relevance Score</span>
              {#if sortField === 'xpu_relevance_score'}
                {#if sortDirection === 'desc'}
                  <ArrowDown class="w-3 h-3 text-blue-600" />
                {:else}
                  <ArrowUp class="w-3 h-3 text-blue-600" />
                {/if}
              {:else}
                <ArrowUpDown class="w-3 h-3 opacity-0 group-hover:opacity-50 transition" />
              {/if}
            </button>
          </th>
          <th class="px-3 py-2.5 w-16">
            <button
              on:click={() => toggleSort('number')}
              class="flex items-center gap-1 hover:text-slate-700 transition group"
            >
              <span>PR #</span>
              {#if sortField === 'number'}
                {#if sortDirection === 'desc'}
                  <ArrowDown class="w-3 h-3 text-blue-600" />
                {:else}
                  <ArrowUp class="w-3 h-3 text-blue-600" />
                {/if}
              {:else}
                <ArrowUpDown class="w-3 h-3 opacity-0 group-hover:opacity-50 transition" />
              {/if}
            </button>
          </th>
          <th class="px-3 py-2.5 min-w-[200px]">Title</th>
          <th class="px-3 py-2.5 w-24">Submitter</th>
          <th class="px-3 py-2.5 w-20">Hardware</th>
          <th class="px-3 py-2.5 w-16">State</th>
          <th class="px-3 py-2.5 min-w-[100px]">Types</th>
          <th class="px-3 py-2.5 w-24">
            <button
              on:click={() => toggleSort('created_at')}
              class="flex items-center gap-1 hover:text-slate-700 transition group"
            >
              <span>Created</span>
              {#if sortField === 'created_at'}
                {#if sortDirection === 'desc'}
                  <ArrowDown class="w-3 h-3 text-blue-600" />
                {:else}
                  <ArrowUp class="w-3 h-3 text-blue-600" />
                {/if}
              {:else}
                <ArrowUpDown class="w-3 h-3 opacity-0 group-hover:opacity-50 transition" />
              {/if}
            </button>
          </th>
          <th class="px-3 py-2.5 w-12"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#if filteredPRs.length === 0}
          <tr>
            <td colspan="9" class="px-4 py-8 text-center text-xs text-slate-400">
              {prs.length === 0 ? 'No pull requests available' : 'No pull requests match the current filters'}
            </td>
          </tr>
        {:else}
          {#each filteredPRs as pr}
            <tr class="hover:bg-slate-50/70 transition group">
              <td class="px-3 py-2.5">
                <div class="flex items-center justify-center">
                  <span class="px-1.5 py-1 rounded text-[10px] font-bold border {getXPUScoreBadgeClass(pr.xpu_relevance_score)}">
                    {pr.xpu_relevance_score}
                  </span>
                </div>
              </td>
              <td class="px-3 py-2.5 text-[10px] text-slate-400 font-mono">
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:text-blue-600 transition-colors hover:underline"
                >
                  #{pr.number}
                </a>
              </td>
              <td class="px-3 py-2.5 text-[13px] font-medium text-slate-800">
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
              <td class="px-3 py-2.5 text-[11px] text-slate-600">
                <div class="flex items-center gap-1">
                  <User class="w-3 h-3 text-slate-400" />
                  {pr.submitter}
                </div>
              </td>
              <td class="px-3 py-2.5">
                <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase border {getHardwareBadgeClass(pr.hardware)}">
                  {pr.hardware}
                </span>
              </td>
              <td class="px-3 py-2.5">
                <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase border {getStateBadgeClass(pr.state)}">
                  {pr.state}
                </span>
              </td>
              <td class="px-3 py-2.5">
                <div class="flex flex-wrap gap-1">
                  {#each pr.types as type}
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase border {getTypeBadgeClass(type)}">
                      {type}
                    </span>
                  {/each}
                </div>
              </td>
              <td class="px-3 py-2.5 text-[10px] text-slate-500">
                {formatDate(pr.created_at)}
              </td>
              <td class="px-3 py-2.5">
                <button
                  on:click={() => togglePRDetails(pr.number)}
                  class="text-blue-600 hover:text-blue-700 transition"
                  title={expandedPRMap[pr.number] ? 'Hide details' : 'Show details'}
                >
                  {#if expandedPRMap[pr.number]}
                    <ChevronUp class="w-4 h-4" />
                  {:else}
                    <ChevronDown class="w-4 h-4" />
                  {/if}
                </button>
              </td>
            </tr>
            {#if expandedPRMap[pr.number]}
              <tr class="bg-slate-50/30">
                <td colspan="9" class="px-6 py-4">
                  <div class="space-y-4 text-xs">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div class="space-y-3">
                        <div class="bg-white rounded-lg border border-slate-200 p-3">
                          <div class="flex items-center gap-1.5 mb-2">
                            <Cpu class="w-3.5 h-3.5 text-cyan-600" />
                            <h4 class="font-semibold text-slate-800">XPU Relevance Analysis</h4>
                          </div>
                          <div class="space-y-2">
                            <div class="flex items-center gap-2">
                              <span class="text-slate-600">Score:</span>
                              <span class="px-2 py-1 rounded font-bold border {getXPUScoreBadgeClass(pr.xpu_relevance_score)}">
                                {pr.xpu_relevance_score}
                              </span>
                            </div>
                            {#if pr.xpu_relevance_justification}
                              <div>
                                <span class="text-slate-600 block mb-1">Justification:</span>
                                <div class="text-slate-700 bg-slate-50 rounded p-2 text-[11px] leading-relaxed">
                                  {#if Array.isArray(pr.xpu_relevance_justification)}
                                    {pr.xpu_relevance_justification.flat().join(', ')}
                                  {:else if typeof pr.xpu_relevance_justification === 'object'}
                                    {JSON.stringify(pr.xpu_relevance_justification)}
                                  {:else}
                                    {pr.xpu_relevance_justification}
                                  {/if}
                                </div>
                              </div>
                            {/if}
                          </div>
                        </div>

                        <div class="bg-white rounded-lg border border-slate-200 p-3">
                          <div class="flex items-center gap-1.5 mb-2">
                            <Tag class="w-3.5 h-3.5 text-blue-600" />
                            <h4 class="font-semibold text-slate-800">Tags</h4>
                          </div>
                          {#if pr.tags && pr.tags.length > 0}
                            <div class="flex flex-wrap gap-1.5">
                              {#each pr.tags as tag}
                                <span class="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                                  {tag}
                                </span>
                              {/each}
                            </div>
                          {:else}
                            <p class="text-slate-400 text-[10px]">No tags</p>
                          {/if}
                        </div>
                      </div>

                      <div class="space-y-3">
                        <div class="bg-white rounded-lg border border-slate-200 p-3">
                          <div class="flex items-center gap-1.5 mb-2">
                            <AlertCircle class="w-3.5 h-3.5 text-amber-600" />
                            <h4 class="font-semibold text-slate-800">AI Analysis</h4>
                          </div>
                          <p class="text-slate-700 text-[11px] leading-relaxed">
                            {pr.reasoning}
                          </p>
                        </div>

                        {#if pr.body}
                          <div class="bg-white rounded-lg border border-slate-200 p-3">
                            <div class="flex items-center gap-1.5 mb-2">
                              <FileText class="w-3.5 h-3.5 text-slate-600" />
                              <h4 class="font-semibold text-slate-800">Description</h4>
                            </div>
                            <div class="text-slate-700 text-[11px] leading-relaxed max-h-40 overflow-y-auto bg-slate-50 rounded p-2">
                              {pr.body}
                            </div>
                          </div>
                        {/if}
                      </div>
                    </div>

                    {#if pr.triton_ops && pr.triton_ops.length > 0}
                      <div class="mt-4">
                        <div class="bg-white rounded-lg border border-slate-200 p-3">
                          <div class="flex items-center gap-1.5 mb-3">
                            <Code class="w-4 h-4 text-purple-600" />
                            <h4 class="font-semibold text-slate-800">Triton Kernel Ops ({pr.triton_ops.length})</h4>
                          </div>
                          <div class="space-y-2">
                            {#each pr.triton_ops as op}
                              <div class="border border-slate-200 rounded-lg overflow-hidden">
                                <button
                                  on:click={() => toggleOpDetails(pr.number, op.op_name)}
                                  class="w-full p-3 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between"
                                >
                                  <div class="flex items-center gap-3 flex-1 text-left">
                                    <div class="flex flex-col gap-1">
                                      <div class="flex items-center gap-2">
                                        <span class="font-mono font-bold text-slate-800 text-xs">{op.op_name}</span>
                                        <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase border {getStatusBadgeClass(op.meta.status)}">
                                          {op.meta.status}
                                        </span>
                                      </div>
                                      <div class="flex items-center gap-2 flex-wrap">
                                        <span class="text-[10px] text-slate-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                          {op.high_level_category}
                                        </span>
                                        <span class="text-[10px] text-slate-500">Confidence: {(op.confidence * 100).toFixed(0)}%</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div class="flex items-center gap-3">
                                    <div class="flex flex-col items-end gap-1">
                                      <div class="flex items-center gap-1">
                                        <span class="text-[9px] text-slate-500">TorchInductor:</span>
                                        <span class="text-[9px] font-semibold {op.torch_inductor_triton.toLowerCase() === 'supported' ? 'text-green-600' : 'text-slate-600'}">
                                          {op.torch_inductor_triton}
                                        </span>
                                      </div>
                                      <div class="flex items-center gap-1">
                                        <span class="text-[9px] text-slate-500">Official Triton:</span>
                                        <span class="text-[9px] font-semibold text-blue-600">
                                          {op.official_triton.summary ? 'Available' : 'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                    {#if isOpExpanded(pr.number, op.op_name)}
                                      <ChevronUp class="w-4 h-4 text-slate-400" />
                                    {:else}
                                      <ChevronDown class="w-4 h-4 text-slate-400" />
                                    {/if}
                                  </div>
                                </button>

                                {#if isOpExpanded(pr.number, op.op_name)}
                                  <div class="p-3 bg-white border-t border-slate-200">
                                    <div class="space-y-3 text-[11px]">
                                      <div>
                                        <span class="font-semibold text-slate-700 block mb-1">Description:</span>
                                        <p class="text-slate-600 leading-relaxed">{op.description}</p>
                                      </div>

                                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div class="bg-slate-50 rounded p-2 border border-slate-200">
                                          <span class="font-semibold text-slate-700 block mb-1.5">TorchInductor Triton:</span>
                                          <span class="font-mono px-2 py-1 rounded text-[10px] {op.torch_inductor_triton.toLowerCase() === 'supported' ? 'text-green-700 bg-green-50 border border-green-200' : 'text-slate-700 bg-slate-100 border border-slate-200'} inline-block">
                                            {op.torch_inductor_triton}
                                          </span>
                                        </div>

                                        <div class="bg-slate-50 rounded p-2 border border-slate-200">
                                          <span class="font-semibold text-slate-700 block mb-1.5">Official Triton:</span>
                                          {#if op.official_triton.summary}
                                            <p class="text-slate-600 text-[10px] leading-relaxed">{op.official_triton.summary}</p>
                                          {:else}
                                            <span class="text-slate-400 text-[10px]">No summary available</span>
                                          {/if}
                                        </div>
                                      </div>

                                      <div class="bg-blue-50 rounded p-2 border border-blue-200">
                                        <span class="font-semibold text-slate-700 block mb-1.5">Backend Hint:</span>
                                        <span class="text-slate-600">{op.backend_hint}</span>
                                        <span class="font-semibold text-slate-700 block mt-2 mb-1">Pattern:</span>
                                        <span class="font-mono text-blue-700 text-[10px] bg-white px-1.5 py-0.5 rounded">{op.likely_triton_pattern}</span>
                                      </div>

                                      <div class="bg-slate-50 rounded p-2 border border-slate-200">
                                        <span class="font-semibold text-slate-700 block mb-1.5">Function Signature:</span>
                                        <code class="text-[10px] text-slate-600 bg-white px-2 py-1 rounded block overflow-x-auto">{op.meta.func_signature}</code>
                                      </div>

                                      <div class="grid grid-cols-2 gap-2">
                                        <div>
                                          <span class="font-semibold text-slate-600 block mb-1">CUDA Function:</span>
                                          <span class="font-mono text-[10px] {op.meta.cuda_func ? 'text-green-700' : 'text-slate-400'}">
                                            {op.meta.cuda_func || 'N/A'}
                                          </span>
                                        </div>
                                        <div>
                                          <span class="font-semibold text-slate-600 block mb-1">XPU Function:</span>
                                          <span class="font-mono text-[10px] {op.meta.xpu_func ? 'text-green-700' : 'text-red-600'}">
                                            {op.meta.xpu_func || 'N/A'}
                                          </span>
                                        </div>
                                      </div>

                                      {#if op.meta.dispatches && Object.keys(op.meta.dispatches).length > 0}
                                        <div>
                                          <span class="font-semibold text-slate-700 block mb-1.5">Dispatches:</span>
                                          <div class="flex flex-wrap gap-1.5">
                                            {#each Object.entries(op.meta.dispatches) as [backend, func]}
                                              <span class="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-700 border border-slate-200">
                                                <span class="font-semibold">{backend}:</span> {func}
                                              </span>
                                            {/each}
                                          </div>
                                        </div>
                                      {/if}

                                      <div class="text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                                        <span class="font-semibold">Source:</span> {op.meta.source_file}
                                      </div>
                                    </div>
                                  </div>
                                {/if}
                              </div>
                            {/each}
                          </div>
                        </div>
                      </div>
                    {/if}
                  </div>
                </td>
              </tr>
            {/if}
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  {#if totalPages > 1}
    <div class="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
      <div class="text-xs text-slate-600">
        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, allFilteredPRs.length)} of {allFilteredPRs.length}
      </div>

      <div class="flex items-center gap-1">
        <button
          on:click={previousPage}
          disabled={currentPage === 1}
          class="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
        >
          <ChevronLeft class="w-3.5 h-3.5" />
          <span class="text-xs font-medium">Previous</span>
        </button>

        <div class="flex items-center gap-1">
          {#each pageNumbers as pageNum}
            {#if pageNum === -1}
              <span class="px-2 text-slate-400">...</span>
            {:else}
              <button
                on:click={() => goToPage(pageNum)}
                class="px-2.5 py-1 rounded text-xs font-medium transition {pageNum === currentPage ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-white border border-slate-200'}"
              >
                {pageNum}
              </button>
            {/if}
          {/each}
        </div>

        <button
          on:click={nextPage}
          disabled={currentPage === totalPages}
          class="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
        >
          <span class="text-xs font-medium">Next</span>
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  {/if}
</div>