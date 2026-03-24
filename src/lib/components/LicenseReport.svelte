<script lang="ts">
  import { onMount } from 'svelte';
  import { licenseReports, licenseReportsLoading, licenseReportsError } from '$lib/stores/appStore';
  import { fetchLicenseReport, getLicenseDownloadUrl } from '$lib/services/api';
  import LoadingState from './LoadingState.svelte';
  import EmptyState from './EmptyState.svelte';

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
  <div class="space-y-4">
    <div class="flex flex-wrap gap-3 items-center mb-2">
      <input class="input input-sm border px-2 py-1 rounded" placeholder="Search file or reason..." bind:value={searchQuery} on:input={handleFilterChange} />
      <select class="input input-sm border px-2 py-1 rounded" bind:value={selectedSeverity} on:change={handleFilterChange}>
        {#each availableSeverities as sev}<option>{sev}</option>{/each}
      </select>
      <select class="input input-sm border px-2 py-1 rounded" bind:value={selectedCategory} on:change={handleFilterChange}>
        {#each availableCategories as cat}<option>{cat}</option>{/each}
      </select>
      <select class="input input-sm border px-2 py-1 rounded" bind:value={selectedSpdx} on:change={handleFilterChange}>
        {#each availableSpdx as spdx}<option>{spdx}</option>{/each}
      </select>
      <span class="ml-auto text-xs text-slate-500">{totalItems} results</span>
    </div>
    <div class="overflow-x-auto rounded border">
      <table class="min-w-full text-xs">
        <thead class="bg-slate-50 border-b">
          <tr>
            <th class="px-2 py-1 text-left">File</th>
            <th>Line</th>
            <th>Severity</th>
            <th>Category</th>
            <th>SPDX</th>
            <th>Reason</th>
            <th>Suggestion</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {#each paginated as item}
            <tr class="border-b hover:bg-slate-50">
              <td class="px-2 py-1 font-mono break-all">{item.file}</td>
              <td class="text-center">{item.line}</td>
              <td class="text-center">{item.severity}</td>
              <td class="text-center">{item.category}</td>
              <td class="text-center">{item.spdx_id}</td>
              <td class="max-w-xs whitespace-pre-line">{item.reason}</td>
              <td class="max-w-xs whitespace-pre-line">{item.suggestion}</td>
              <td class="text-center">
                {#if item.scan_id}
                  <button class="text-blue-600 underline" on:click={() => download(item.scan_id)}>Download</button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class="flex items-center gap-2 justify-end mt-2">
      <span class="text-xs">Page {currentPage} / {totalPages}</span>
      <button on:click={() => handlePageChange(Math.max(1, currentPage-1))} disabled={currentPage===1}>Prev</button>
      <button on:click={() => handlePageChange(Math.min(totalPages, currentPage+1))} disabled={currentPage===totalPages}>Next</button>
      <select bind:value={itemsPerPage} on:change={() => handleItemsPerPageChange(+itemsPerPage)} class="input input-xs border px-1 py-0.5 rounded">
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
    </div>
  </div>
{/if}
