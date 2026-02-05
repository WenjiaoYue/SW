<script lang="ts">
  import { onMount } from 'svelte';
  import { xpuSyncIssues, xpuSyncLoading, xpuSyncError } from '$lib/stores/appStore';
  import { fetchXPUSync } from '$lib/services/api';
  import LoadingState from './LoadingState.svelte';
  import EmptyState from './EmptyState.svelte';
  import Pagination from './Pagination.svelte';
  import { AlertTriangle, CheckCircle, XCircle, Info, FileCode, RefreshCw, Lightbulb } from 'lucide-svelte';

  let selectedSeverity: string = 'All';
  let selectedCategory: string = 'All';
  let searchQuery: string = '';
  let cudaValidatedFilter: string = 'All';
  let currentPage = 1;
  let itemsPerPage = 10;

  $: uniqueSeverities = ['All', ...new Set($xpuSyncIssues.map(i => i.severity))];
  $: uniqueCategories = ['All', ...new Set($xpuSyncIssues.map(i => i.category))];

  $: filteredIssues = $xpuSyncIssues.filter(issue => {
    const matchesSeverity = selectedSeverity === 'All' || issue.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'All' || issue.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      issue.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.op_name && issue.op_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCudaValidated = cudaValidatedFilter === 'All' ||
      (cudaValidatedFilter === 'validated' && issue.cuda_validated) ||
      (cudaValidatedFilter === 'not_validated' && !issue.cuda_validated);
    return matchesSeverity && matchesCategory && matchesSearch && matchesCudaValidated;
  });

  $: paginatedIssues = filteredIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function handlePageChange(page: number) {
    currentPage = page;
  }

  function handleItemsPerPageChange(newItemsPerPage: number) {
    itemsPerPage = newItemsPerPage;
    currentPage = 1;
  }

  const severityColors: Record<string, string> = {
    critical: 'text-red-600 bg-red-50 border-red-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    low: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  const severityIcons: Record<string, any> = {
    critical: XCircle,
    high: AlertTriangle,
    medium: Info,
    low: CheckCircle
  };

  onMount(async () => {
    xpuSyncLoading.set(true);
    xpuSyncError.set(null);

    const data = await fetchXPUSync();
    xpuSyncIssues.set(data);
    xpuSyncLoading.set(false);
  });

  function getSeverityIcon(severity: string) {
    return severityIcons[severity] || Info;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

{#if $xpuSyncLoading}
  <LoadingState
    title="Loading XPU Sync"
    footerText="Analyzing pointer calculations and XPU synchronization issues..."
    steps={[
      { icon: RefreshCw, label: 'Scanning pointer operations...', color: 'text-blue-600' },
      { icon: AlertTriangle, label: 'Validating against CUDA...', color: 'text-orange-600' },
      { icon: CheckCircle, label: 'Processing sync issues...', color: 'text-green-600' }
    ]}
  />
{:else if $xpuSyncIssues.length === 0}
  <EmptyState
    icon={CheckCircle}
    title="No Sync Issues Found"
    message="XPU pointer scan completed with no issues detected."
  />
{:else}
  <div class="space-y-6">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">XPU Sync</h2>
          <p class="text-sm text-slate-600 mt-1">Pointer calculation and synchronization issues</p>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <span class="text-slate-500">Total:</span>
          <span class="font-semibold text-slate-800">{filteredIssues.length}</span>
        </div>
      </div>

      <div class="space-y-4 mb-6">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search by file, code, or operation name..."
          class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-700 mb-1.5 block">Severity</label>
            <div class="flex flex-wrap gap-2">
              {#each uniqueSeverities as severity}
                <button
                  on:click={() => selectedSeverity = severity}
                  class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all border"
                  class:bg-slate-800={selectedSeverity === severity}
                  class:text-white={selectedSeverity === severity}
                  class:bg-white={selectedSeverity !== severity}
                  class:text-slate-600={selectedSeverity !== severity}
                  class:border-slate-300={selectedSeverity !== severity}
                  class:border-slate-800={selectedSeverity === severity}
                >
                  {severity}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-700 mb-1.5 block">Category</label>
            <div class="flex flex-wrap gap-2">
              {#each uniqueCategories as category}
                <button
                  on:click={() => selectedCategory = category}
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
            <label class="text-xs font-semibold text-slate-700 mb-1.5 block">CUDA Validation</label>
            <div class="flex flex-wrap gap-2">
              {#each ['All', 'validated', 'not_validated'] as option}
                <button
                  on:click={() => cudaValidatedFilter = option}
                  class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all border"
                  class:bg-slate-800={cudaValidatedFilter === option}
                  class:text-white={cudaValidatedFilter === option}
                  class:bg-white={cudaValidatedFilter !== option}
                  class:text-slate-600={cudaValidatedFilter !== option}
                  class:border-slate-300={cudaValidatedFilter !== option}
                  class:border-slate-800={cudaValidatedFilter === option}
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
              <div class="p-2 rounded-lg {severityColors[issue.severity] || 'bg-slate-100 text-slate-600'}">
                <svelte:component this={getSeverityIcon(issue.severity)} class="w-5 h-5" />
              </div>

              <div class="flex-1 space-y-3">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <FileCode class="w-4 h-4 text-slate-500" />
                      <code class="text-sm font-mono text-slate-700">{issue.file}</code>
                      <span class="text-xs text-slate-500">Line {issue.line}</span>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="px-2 py-0.5 text-xs font-medium rounded {severityColors[issue.severity] || 'bg-slate-100 text-slate-600'} border">
                        {issue.severity}
                      </span>
                      <span class="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {issue.category.replace(/-/g, ' ')}
                      </span>
                      {#if issue.cuda_validated}
                        <span class="px-2 py-0.5 text-xs font-medium rounded bg-green-50 text-green-600 border border-green-200">
                          CUDA Validated
                        </span>
                      {/if}
                      {#if issue.op_name}
                        <span class="px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-600 border border-blue-200">
                          {issue.op_name}
                        </span>
                      {/if}
                    </div>
                  </div>
                </div>

                <div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <h4 class="text-xs font-semibold text-slate-700 mb-1">Code</h4>
                  <pre class="text-xs font-mono text-slate-800 whitespace-pre-wrap break-all">{issue.code}</pre>
                </div>

                <div class="space-y-2">
                  <div>
                    <h4 class="text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">Reason</h4>
                    <p class="text-sm text-slate-600">{issue.reason}</p>
                  </div>

                  <div>
                    <h4 class="text-xs font-semibold text-green-700 mb-1 uppercase tracking-wide flex items-center gap-1">
                      <Lightbulb class="w-3 h-3" />
                      Suggestion
                    </h4>
                    <p class="text-sm text-slate-600">{issue.suggestion}</p>
                  </div>
                </div>

                {#if issue.cuda_validated && issue.cuda_has_same_issue !== null}
                  <div class="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div class="flex items-start gap-2">
                      <Info class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div class="flex-1">
                        <h4 class="text-xs font-semibold text-blue-800 mb-1">CUDA Validation</h4>
                        <p class="text-xs text-blue-700">
                          {issue.cuda_has_same_issue ? 'CUDA has the same issue' : 'CUDA does not have this issue'}
                        </p>
                        {#if issue.adjusted_severity}
                          <p class="text-xs text-blue-600 mt-1">
                            Adjusted Severity: <span class="font-semibold">{issue.adjusted_severity}</span>
                          </p>
                        {/if}
                        {#if issue.validation_reason}
                          <p class="text-xs text-blue-600 mt-1">{issue.validation_reason}</p>
                        {/if}
                        {#if issue.cuda_file}
                          <p class="text-xs text-blue-600 mt-1 font-mono">
                            File: {issue.cuda_file}
                            {#if issue.cuda_function}
                              ({issue.cuda_function})
                            {/if}
                          </p>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/if}

                <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span class="text-xs text-slate-500">
                    Scanned: {formatDate(issue.scanned_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    {#if filteredIssues.length > 0}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredIssues.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    {/if}
  </div>
{/if}

<style>
  pre {
    max-width: 100%;
  }
</style>
