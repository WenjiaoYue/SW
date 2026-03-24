<script lang="ts">
  import { onMount } from 'svelte';
  import { syclReports, syclReportsLoading, syclReportsError } from '$lib/stores/appStore';
  import LoadingState from './LoadingState.svelte';
  import EmptyState from './EmptyState.svelte';
  import { marked } from 'marked';

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
  <div class="space-y-4">
    <div class="flex flex-wrap gap-3 items-center mb-2">
      <input class="input input-sm border px-2 py-1 rounded" placeholder="Search symbol..." bind:value={searchSymbol} on:input={handleFilterChange} />
      <input class="input input-sm border px-2 py-1 rounded" placeholder="Search file..." bind:value={searchFile} on:input={handleFilterChange} />
      <input class="input input-sm border px-2 py-1 rounded" placeholder="Search reason..." bind:value={searchQuery} on:input={handleFilterChange} />
      <select class="input input-sm border px-2 py-1 rounded" bind:value={selectedSeverity} on:change={handleFilterChange}>
        {#each availableSeverities as sev}<option>{sev}</option>{/each}
      </select>
      <select class="input input-sm border px-2 py-1 rounded" bind:value={selectedCategory} on:change={handleFilterChange}>
        {#each availableCategories as cat}<option>{cat}</option>{/each}
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
            <th>Symbol</th>
            <th>Reason</th>
            <th>Suggestion</th>
            <th>Code</th>
            <th>LLM Analysis</th>
          </tr>
        </thead>
        <tbody>
          {#each paginated as item, idx}
            <tr class="border-b hover:bg-slate-50">
              <td class="px-2 py-1 font-mono break-all">{item.file}</td>
              <td class="text-center">{item.line}</td>
              <td class="text-center">{item.severity}</td>
              <td class="text-center">{item.category}</td>
              <td class="text-center">{item.symbol}</td>
              <td class="max-w-xs whitespace-pre-line">{item.reason}</td>
              <td class="max-w-xs whitespace-pre-line">{item.suggestion}</td>
              <td class="max-w-xs whitespace-pre-line font-mono">{item.code}</td>
              <td class="text-center">
                {#if item.llm_analysis}
                  <button class="text-blue-600 underline" on:click={() => toggleExpand(idx)}>{expanded[idx] ? 'Hide' : 'Show'}</button>
                {/if}
              </td>
            </tr>
            {#if expanded[idx] && item.llm_analysis}
              <tr>
                <td colspan="9" class="bg-slate-50 px-4 py-2">
                  <div class="prose max-w-none text-xs" style="white-space:pre-line">{@html marked.parse(item.llm_analysis)}</div>
                </td>
              </tr>
            {/if}
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
