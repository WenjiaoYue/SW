<script lang="ts">
  import { onMount } from 'svelte';
  import { potentialIssues, potentialIssuesLoading, potentialIssuesError } from '$lib/stores/appStore';
  import { fetchPotentialIssues } from '$lib/services/api';
  import LoadingState from './LoadingState.svelte';
  import EmptyState from './EmptyState.svelte';
  import Pagination from './Pagination.svelte';
  import { AlertTriangle, CheckCircle, XCircle, Info, FileText, Calendar } from 'lucide-svelte';

  let selectedSeverity: string = 'All';
  let selectedCategory: string = 'All';
  let searchQuery: string = '';
  let currentPage = 1;
  let itemsPerPage = 10;
  let selectedDate: string = new Date().toISOString().split('T')[0];

  $: uniqueSeverities = ['All', ...new Set($potentialIssues.map(i => i.severity))];
  $: uniqueCategories = ['All', ...new Set($potentialIssues.map(i => i.category))];

  $: filteredIssues = $potentialIssues.filter(issue => {
    const matchesSeverity = selectedSeverity === 'All' || issue.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'All' || issue.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      issue.op_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.details.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSeverity && matchesCategory && matchesSearch;
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

  async function loadData() {
    potentialIssuesLoading.set(true);
    potentialIssuesError.set(null);

    try {
      const data = await fetchPotentialIssues({ date: selectedDate });
      potentialIssues.set(data.data);
    } catch (error: any) {
      potentialIssuesError.set(error.message || 'Failed to load data');
    } finally {
      potentialIssuesLoading.set(false);
    }
  }

  onMount(() => {
    loadData();
  });

  async function handleDateChange() {
    currentPage = 1;
    await loadData();
  }

  function getSeverityIcon(severity: string) {
    return severityIcons[severity] || Info;
  }
</script>

{#if $potentialIssuesLoading}
  <LoadingState
    title="Loading Potential Issues"
    footerText="Analyzing validation gaps and compatibility issues..."
    steps={[
      { icon: FileText, label: 'Fetching validation reports...', color: 'text-blue-600' },
      { icon: AlertTriangle, label: 'Analyzing severity levels...', color: 'text-orange-600' },
      { icon: Info, label: 'Processing recommendations...', color: 'text-green-600' }
    ]}
  />
{:else if $potentialIssues.length === 0}
  <EmptyState
    icon={CheckCircle}
    title="No Issues Found"
    message="No potential issues detected in the current validation report."
  />
{:else}
  <div class="space-y-6">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Potential Issues</h2>
          <p class="text-sm text-slate-600 mt-1">Validation gaps and compatibility issues</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-slate-500" />
            <input
              type="date"
              bind:value={selectedDate}
              on:change={handleDateChange}
              class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div class="flex items-center gap-2 text-sm">
            <span class="text-slate-500">Total:</span>
            <span class="font-semibold text-slate-800">{filteredIssues.length}</span>
          </div>
        </div>
      </div>

      <div class="space-y-4 mb-6">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search by operation name or details..."
          class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />

        <div class="flex gap-4">
          <div class="flex-1">
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

          <div class="flex-1">
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
                  {category.replace(/_/g, ' ')}
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
                  <div>
                    <h3 class="text-lg font-semibold text-slate-800">{issue.op_name}</h3>
                    <div class="flex items-center gap-3 mt-1">
                      <span class="px-2 py-0.5 text-xs font-medium rounded {severityColors[issue.severity] || 'bg-slate-100 text-slate-600'} border">
                        {issue.severity}
                      </span>
                      <span class="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {issue.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {#if issue.details && issue.details.length > 0}
                  <div class="space-y-1">
                    <h4 class="text-xs font-semibold text-slate-700 uppercase tracking-wide">Details</h4>
                    <ul class="space-y-1 text-sm text-slate-600">
                      {#each issue.details as detail}
                        <li class="flex items-start gap-2">
                          <span class="text-slate-400 mt-1">•</span>
                          <span>{detail}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                {/if}

                {#if issue.recommendation && issue.recommendation.length > 0}
                  <div class="space-y-1">
                    <h4 class="text-xs font-semibold text-slate-700 uppercase tracking-wide">Recommendations</h4>
                    <ul class="space-y-1 text-sm text-slate-600">
                      {#each issue.recommendation as rec}
                        <li class="flex items-start gap-2">
                          <span class="text-green-500 mt-1">✓</span>
                          <span>{rec}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                {/if}

                <div class="flex gap-4 pt-2 border-t border-slate-100">
                  {#if issue.cuda_file}
                    <div class="text-xs">
                      <span class="text-slate-500">CUDA File:</span>
                      <span class="text-slate-700 font-mono ml-1">{issue.cuda_file}</span>
                    </div>
                  {/if}
                  {#if issue.xpu_file}
                    <div class="text-xs">
                      <span class="text-slate-500">XPU File:</span>
                      <span class="text-slate-700 font-mono ml-1">{issue.xpu_file}</span>
                    </div>
                  {/if}
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
  .nav-btn.active {
    background: linear-gradient(to right, #1e293b, #334155);
    color: white;
    font-weight: 600;
  }
</style>
