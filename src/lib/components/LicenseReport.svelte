<script lang="ts">
  import { onMount } from 'svelte';
  import { licenseReports, licenseReportsLoading, licenseReportsError } from '$lib/stores/appStore';
  import { fetchLicenseReport, getLicenseDownloadUrl } from '$lib/services/api';
  import LoadingState from './LoadingState.svelte';
  import EmptyState from './EmptyState.svelte';
  import { FileText, ListFilter as Filter, Search, Download } from 'lucide-svelte';

  let selectedSeverity: string = 'All';
  let selectedCategory: string = 'All';
  let selectedSpdx: string = 'All';
  let searchQuery: string = '';
  let currentPage = 1;
  let itemsPerPage = 20;

  $: availableSeverities = ['All', ...Array.from(new Set($licenseReports.map((i: any) => i.severity)))];
  $: availableCategories = ['All', ...Array.from(new Set($licenseReports.map((i: any) => i.category)))];
  $: availableSpdx = ['All', ...Array.from(new Set($licenseReports.map((i: any) => i.spdx_id).filter(Boolean)))];

  $: filtered = $licenseReports.filter((item: any) => {
    const sev = selectedSeverity === 'All' || item.severity === selectedSeverity;
    const cat = selectedCategory === 'All' || item.category === selectedCategory;
    const spdx = selectedSpdx === 'All' || item.spdx_id === selectedSpdx;
    const search = !searchQuery || item.file.toLowerCase().includes(searchQuery.toLowerCase()) || (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase()));
    return sev && cat && spdx && search;
  });
  $: totalItems = filtered.length;
  $: totalPages = Math.ceil(totalItems / itemsPerPage);
  $: paginated = filtered.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);

  function handlePageChange(page: number) { currentPage = page; }
  function handleItemsPerPageChange(n: number) { itemsPerPage = n; currentPage = 1; }
  function handleFilterChange() { currentPage = 1; }

  function download(scanId: string|null) {
    if (!scanId) return;
    window.open(getLicenseDownloadUrl(scanId), '_blank');
  }
</script>

{#if $licenseReportsLoading}
  <LoadingState title="Loading License Compliance" />
{:else if $licenseReportsError}
  <div class="p-8 text-center text-red-600">{$licenseReportsError}</div>
{:else if !$licenseReports.length}
  <EmptyState message="No license compliance findings." />
{:else}
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl p-6 border border-blue-100">
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 rounded-lg bg-blue-600 text-white">
          <FileText class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-800">License Compliance Report</h2>
          <p class="text-sm text-slate-600">Review and manage license compliance issues</p>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-white rounded-lg p-4 border border-slate-200">
        <div class="flex items-center gap-2 mb-3">
          <Filter class="w-4 h-4 text-slate-500" />
          <span class="text-sm font-medium text-slate-700">Filters</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search file or reason..."
              bind:value={searchQuery}
              on:input={handleFilterChange}
            />
          </div>
          <select class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" bind:value={selectedSeverity} on:change={handleFilterChange}>
            {#each availableSeverities as sev}<option>{sev}</option>{/each}
          </select>
          <select class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" bind:value={selectedCategory} on:change={handleFilterChange}>
            {#each availableCategories as cat}<option>{cat}</option>{/each}
          </select>
          <select class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" bind:value={selectedSpdx} on:change={handleFilterChange}>
            {#each availableSpdx as spdx}<option>{spdx}</option>{/each}
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
      {#each paginated as item}
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          <!-- Card Header -->
          <div class="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <FileText class="w-4 h-4 text-blue-600 flex-shrink-0" />
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
                <code class="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 font-mono">
                  {item.spdx_id}
                </code>
              </div>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-4">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue</div>
                </div>
                <p class="text-sm text-slate-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 leading-relaxed">
                  {item.reason}
                </p>
              </div>
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recommendation</div>
                </div>
                <p class="text-sm text-slate-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 leading-relaxed">
                  {item.suggestion}
                </p>
              </div>
            </div>

            {#if item.scan_id}
              <div class="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                <button
                  class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm hover:shadow"
                  on:click={() => download(item.scan_id)}
                >
                  <Download class="w-4 h-4" />
                  Download Report
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
    >

      <!-- Pagination -->
      <div class="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between">
        <div class="text-sm text-slate-600">
          Showing <span class="font-medium text-slate-800">{(currentPage-1)*itemsPerPage + 1}</span> to <span class="font-medium text-slate-800">{Math.min(currentPage*itemsPerPage, totalItems)}</span> of <span class="font-medium text-slate-800">{totalItems}</span> results
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-600">Rows per page:</span>
          <select bind:value={itemsPerPage} on:change={() => handleItemsPerPageChange(+itemsPerPage)} class="px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
