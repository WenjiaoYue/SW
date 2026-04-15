<script lang="ts">
  import { onMount } from 'svelte';
  import { syclReports, syclReportsLoading, syclReportsError } from '$lib/stores/appStore';
  import LoadingState from './LoadingState.svelte';
  import EmptyState from './EmptyState.svelte';
  import { marked } from 'marked';
  import { Ban, ListFilter as Filter, Search, Code, ChevronDown, ChevronUp } from 'lucide-svelte';

  let selectedSeverity: string = 'All';
  let selectedCategory: string = 'All';
  let searchSymbol: string = '';
  let searchFile: string = '';
  let searchQuery: string = '';
  let currentPage = 1;
  let itemsPerPage = 20;
  let expanded: Record<string, boolean> = {};

  $: availableSeverities = ['All', ...Array.from(new Set($syclReports.map((i: any) => i.severity)))];
  $: availableCategories = ['All', ...Array.from(new Set($syclReports.map((i: any) => i.category)))];

  $: filtered = $syclReports.filter((item: any) => {
    const sev = selectedSeverity === 'All' || item.severity === selectedSeverity;
    const cat = selectedCategory === 'All' || item.category === selectedCategory;
    const symbol = !searchSymbol || (item.symbol && item.symbol.toLowerCase().includes(searchSymbol.toLowerCase()));
    const file = !searchFile || (item.file && item.file.toLowerCase().includes(searchFile.toLowerCase()));
    const search = !searchQuery || (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase()));
    return sev && cat && symbol && file && search;
  });
  $: totalItems = filtered.length;
  $: totalPages = Math.ceil(totalItems / itemsPerPage);
  $: paginated = filtered.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);

  function handlePageChange(page: number) { currentPage = page; }
  function handleItemsPerPageChange(n: number) { itemsPerPage = n; currentPage = 1; }
  function handleFilterChange() { currentPage = 1; }
  function toggleExpand(idx: number) { expanded[idx] = !expanded[idx]; }
</script>

{#if $syclReportsLoading}
  <LoadingState title="Loading SYCL Deprecation" />
{:else if $syclReportsError}
  <div class="p-8 text-center text-red-600">{$syclReportsError}</div>
{:else if !$syclReports.length}
  <EmptyState message="No SYCL deprecation findings." />
{:else}
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 rounded-lg bg-orange-600 text-white">
          <Ban class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-800">SYCL Deprecation Report</h2>
          <p class="text-sm text-slate-600">Identify and resolve deprecated SYCL symbols</p>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-white rounded-lg p-4 border border-slate-200">
        <div class="flex items-center gap-2 mb-3">
          <Filter class="w-4 h-4 text-slate-500" />
          <span class="text-sm font-medium text-slate-700">Filters</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Search symbol..."
              bind:value={searchSymbol}
              on:input={handleFilterChange}
            />
          </div>
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Search file..."
              bind:value={searchFile}
              on:input={handleFilterChange}
            />
          </div>
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Search reason..."
              bind:value={searchQuery}
              on:input={handleFilterChange}
            />
          </div>
          <select class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" bind:value={selectedSeverity} on:change={handleFilterChange}>
            {#each availableSeverities as sev}<option>{sev}</option>{/each}
          </select>
          <select class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" bind:value={selectedCategory} on:change={handleFilterChange}>
            {#each availableCategories as cat}<option>{cat}</option>{/each}
          </select>
        </div>
        <div class="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
          <span class="text-sm text-slate-600">
            <span class="font-semibold text-slate-800">{totalItems}</span> {totalItems === 1 ? 'result' : 'results'} found
          </span>
        </div>
      </div>
    </div>

    <!-- Card View Section -->
    <div class="space-y-4">
      {#each paginated as item, idx}
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          <!-- Card Header -->
          <div class="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <Code class="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div class="min-w-0 flex-1">
                  <div class="font-mono text-sm text-slate-700 truncate">{item.file}</div>
                  <div class="text-xs text-slate-500">Line {item.line}</div>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="inline-flex px-2 py-1 rounded-full text-xs font-medium {item.severity === 'High' ? 'bg-red-100 text-red-700' : item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}">
                  {item.severity}
                </span>
                <span class="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">
                  {item.category}
                </span>
              </div>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-4 space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Symbol</div>
                <code class="block px-3 py-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800 font-mono">
                  {item.symbol}
                </code>
              </div>
              <div>
                <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Code</div>
                <pre class="px-3 py-2 bg-slate-900 text-slate-100 rounded text-xs font-mono overflow-x-auto">{item.code}</pre>
              </div>
            </div>

            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reason</div>
              <p class="text-sm text-slate-700 bg-slate-50 rounded px-3 py-2">{item.reason}</p>
            </div>

            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Suggestion</div>
              <p class="text-sm text-slate-700 bg-green-50 border border-green-200 rounded px-3 py-2">{item.suggestion}</p>
            </div>

            {#if item.llm_analysis}
              <div class="border-t border-slate-200 pt-3">
                <button
                  on:click={() => toggleExpand(idx)}
                  class="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <div class="p-1 bg-blue-600 text-white rounded">
                      <Code class="w-3 h-3" />
                    </div>
                    <span class="text-sm font-medium text-slate-700">LLM Analysis</span>
                  </div>
                  {#if expanded[idx]}
                    <ChevronUp class="w-4 h-4 text-slate-500" />
                  {:else}
                    <ChevronDown class="w-4 h-4 text-slate-500" />
                  {/if}
                </button>
                {#if expanded[idx]}
                  <div class="mt-3 prose prose-sm max-w-none bg-blue-50 border border-blue-200 rounded-lg p-4">
                    {@html marked.parse(item.llm_analysis)}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="text-sm text-slate-600">
          Showing <span class="font-medium text-slate-800">{(currentPage-1)*itemsPerPage + 1}</span> to <span class="font-medium text-slate-800">{Math.min(currentPage*itemsPerPage, totalItems)}</span> of <span class="font-medium text-slate-800">{totalItems}</span> results
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-600">Rows per page:</span>
          <select bind:value={itemsPerPage} on:change={() => handleItemsPerPageChange(+itemsPerPage)} class="px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <div class="flex items-center gap-1 ml-4">
            <button
              on:click={() => handlePageChange(Math.max(1, currentPage-1))}
              disabled={currentPage===1}
              class="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span class="px-3 text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
            <button
              on:click={() => handlePageChange(Math.min(totalPages, currentPage+1))}
              disabled={currentPage===totalPages}
              class="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
