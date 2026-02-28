<script lang="ts">
  import { onMount } from 'svelte';
  import { xpuSyncIssues, xpuSyncLoading, xpuSyncError, currentProject } from '$lib/stores/appStore';
  import { fetchXPUSync } from '$lib/services/api';
  import LoadingState from './LoadingState.svelte';
  import EmptyState from './EmptyState.svelte';
  import Pagination from './Pagination.svelte';
  import { AlertTriangle, CheckCircle, XCircle, Info, FileCode, RefreshCw, Lightbulb } from 'lucide-svelte';

  let selectedCategory: string = 'All';
  let searchQuery: string = '';
  let applicableFilter: string = 'All';
  let currentPage = 1;
  let itemsPerPage = 10;

  $: availableCategories = ['All', ...Array.from(new Set($xpuSyncIssues.map((i: any) => i.category)))];

  $: filteredIssues = $xpuSyncIssues.filter((issue: any) => {
    const categoryMatch = selectedCategory === 'All' || issue.category === selectedCategory;
    const applicableMatch = applicableFilter === 'All' ||
      (applicableFilter === 'applicable' && issue.applicable_to_repo) ||
      (applicableFilter === 'not_applicable' && !issue.applicable_to_repo);
    const searchMatch = !searchQuery ||
      issue.commit_message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.details?.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && applicableMatch && searchMatch;
  });

  $: totalItems = filteredIssues.length;
  $: totalPages = Math.ceil(totalItems / itemsPerPage);
  $: paginatedIssues = filteredIssues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  async function loadData() {
    xpuSyncLoading.set(true);
    xpuSyncError.set(null);

    try {
      const data = await fetchXPUSync({
        page: 1,
        page_size: 1000
      });
      xpuSyncIssues.set(data.data || []);
    } catch (error: any) {
      xpuSyncError.set(error.message || 'Failed to load data');
    } finally {
      xpuSyncLoading.set(false);
    }
  }

  onMount(() => {
    loadData();
  });

  function handlePageChange(page: number) {
    currentPage = page;
  }

  function handleItemsPerPageChange(newItemsPerPage: number) {
    itemsPerPage = newItemsPerPage;
    currentPage = 1;
  }

  function handleFilterChange() {
    currentPage = 1;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getConfidenceBadgeColor(confidence: number): string {
    if (confidence >= 0.8) return 'bg-green-100 text-green-700 border-green-200';
    if (confidence >= 0.6) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (confidence >= 0.4) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  }
</script>

{#if $xpuSyncLoading}
  <LoadingState
    title="Loading CUDA Fix Analysis"
    footerText="Analyzing CUDA commits for XPU applicability..."
    steps={[
      { icon: RefreshCw, label: 'Scanning CUDA commits...', color: 'text-blue-600' },
      { icon: AlertTriangle, label: 'Matching XPU code...', color: 'text-orange-600' },
      { icon: CheckCircle, label: 'Analyzing applicability...', color: 'text-green-600' }
    ]}
  />
{:else if $xpuSyncIssues.length === 0}
  <EmptyState
    icon={CheckCircle}
    title="No CUDA Fixes Found"
    message="No applicable CUDA fixes detected for XPU."
  />
{:else}
  <div class="space-y-6">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">CUDA Fix Analysis</h2>
          <p class="text-sm text-slate-600 mt-1">Potential CUDA fixes applicable to XPU implementation</p>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <span class="text-slate-500">Total:</span>
          <span class="font-semibold text-slate-800">{totalItems}</span>
        </div>
      </div>

      <div class="space-y-4 mb-6">
        <input
          type="text"
          bind:value={searchQuery}
          on:input={handleFilterChange}
          placeholder="Search by commit message, file, or details..."
          class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-700 mb-1.5 block">Category</label>
            <div class="flex flex-wrap gap-2">
              {#each availableCategories as category}
                <button
                  on:click={() => { selectedCategory = category; handleFilterChange(); }}
                  class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all border"
                  class:bg-slate-800={selectedCategory === category}
                  class:text-white={selectedCategory === category}
                  class:bg-white={selectedCategory !== category}
                  class:text-slate-600={selectedCategory !== category}
                  class:border-slate-300={selectedCategory !== category}
                  class:border-slate-800={selectedCategory === category}
                >
                  {category.replace(/-/g, ' ')}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-700 mb-1.5 block">Applicability</label>
            <div class="flex flex-wrap gap-2">
              {#each ['All', 'applicable', 'not_applicable'] as option}
                <button
                  on:click={() => { applicableFilter = option; handleFilterChange(); }}
                  class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all border"
                  class:bg-slate-800={applicableFilter === option}
                  class:text-white={applicableFilter === option}
                  class:bg-white={applicableFilter !== option}
                  class:text-slate-600={applicableFilter !== option}
                  class:border-slate-300={applicableFilter !== option}
                  class:border-slate-800={applicableFilter === option}
                >
                  {option.replace(/_/g, ' ')}
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        {#each paginatedIssues as issue}
          <div class="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all">
            <div class="flex items-start gap-4">
              <div class="p-2 rounded-lg {issue.applicable ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}">
                {#if issue.applicable}
                  <CheckCircle class="w-5 h-5" />
                {:else}
                  <XCircle class="w-5 h-5" />
                {/if}
              </div>

              <div class="flex-1 space-y-3">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-base font-semibold text-slate-800">{issue.commit_message}</h3>
                    <p class="text-xs text-slate-500 font-mono mt-0.5">{issue.commit_hash}</p>
                    <div class="flex items-center gap-2 mt-1.5">
                      <span class="px-2 py-0.5 text-xs font-medium rounded {getConfidenceBadgeColor(issue.confidence)} border">
                        {(issue.confidence * 100).toFixed(0)}% confidence
                      </span>
                      <span class="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {issue.category.replace(/-/g, ' ')}
                      </span>
                      {#if issue.applicable}
                        <span class="px-2 py-0.5 text-xs font-medium rounded bg-green-50 text-green-600 border border-green-200">
                          Applicable
                        </span>
                      {/if}
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span class="text-slate-500">Author:</span>
                    <span class="text-slate-700 ml-1">{issue.author}</span>
                  </div>
                  <div>
                    <span class="text-slate-500">Date:</span>
                    <span class="text-slate-700 ml-1">{formatDate(issue.date)}</span>
                  </div>
                </div>

                <div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <h4 class="text-xs font-semibold text-slate-700 mb-1">CUDA File</h4>
                  <p class="text-xs font-mono text-slate-800">{issue.cuda_file}</p>
                </div>

                {#if issue.anchors.length > 0}
                  <div>
                    <h4 class="text-xs font-semibold text-slate-700 mb-1.5">Anchors</h4>
                    <div class="flex flex-wrap gap-1.5">
                      {#each issue.anchors as anchor}
                        <span class="px-2 py-0.5 text-xs font-mono rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {anchor}
                        </span>
                      {/each}
                    </div>
                  </div>
                {/if}

                <div class="space-y-2">
                  <div>
                    <h4 class="text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">Details</h4>
                    <p class="text-sm text-slate-600">{issue.details}</p>
                  </div>

                  <div>
                    <h4 class="text-xs font-semibold text-green-700 mb-1 uppercase tracking-wide flex items-center gap-1">
                      <Lightbulb class="w-3 h-3" />
                      Recommendation
                    </h4>
                    <p class="text-sm text-slate-600">{issue.recommendation}</p>
                  </div>
                </div>

                {#if issue.xpu_match.found}
                  <div class="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div class="flex items-start gap-2">
                      <Info class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div class="flex-1">
                        <h4 class="text-xs font-semibold text-blue-800 mb-1">XPU Match Found</h4>
                        <div class="flex items-center gap-3 text-xs">
                          <span class="text-blue-700">
                            Confidence: <span class="font-semibold">{(issue.xpu_match.confidence * 100).toFixed(0)}%</span>
                          </span>
                          <span class="text-blue-700">
                            Method: <span class="font-semibold">{issue.xpu_match.method}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    {#if totalItems > 0}
      <Pagination
        {currentPage}
        {totalItems}
        {itemsPerPage}
        on:pageChange={(e) => handlePageChange(e.detail)}
        on:itemsPerPageChange={(e) => handleItemsPerPageChange(e.detail)}
      />
    {/if}
  </div>
{/if}
