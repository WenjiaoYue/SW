<script lang="ts">
  import { onMount } from 'svelte';
  import { scanReports, scanReportsLoading, scanReportsError, currentProject, currentView } from '$lib/stores/appStore';
  import { fetchScanReport } from '$lib/services/api';
  import LoadingState from './LoadingState.svelte';
  import EmptyState from './EmptyState.svelte';
  import Pagination from './Pagination.svelte';
  import { AlertTriangle, CheckCircle, XCircle, Info, FileCode, GitCommit, Shield } from 'lucide-svelte';

  let selectedStatus: string = 'All';
  let selectedRisk: string = 'All';
  let xpuNeedsFixFilter: string = 'All';
  let searchQuery: string = '';
  let currentPage = 1;
  let itemsPerPage = 10;

  const statusColors: Record<string, string> = {
    immune: 'text-green-700 bg-green-50 border-green-200',
    confirmed: 'text-red-700 bg-red-50 border-red-200',
    inconclusive: 'text-yellow-700 bg-yellow-50 border-yellow-200'
  };

  const riskColors: Record<string, string> = {
    low: 'text-blue-600 bg-blue-50 border-blue-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-red-600 bg-red-50 border-red-200'
  };

  const statusIcons: Record<string, any> = {
    immune: CheckCircle,
    confirmed: XCircle,
    inconclusive: AlertTriangle
  };

  $: availableStatuses = ['All', ...Array.from(new Set($scanReports.map((r: any) => r.auto_verifier?.status).filter(Boolean)))];
  $: availableRisks = ['All', ...Array.from(new Set($scanReports.map((r: any) => r.risk).filter(Boolean)))];

  $: filteredReports = $scanReports.filter((report: any) => {
    const statusMatch = selectedStatus === 'All' || report.auto_verifier?.status === selectedStatus;
    const riskMatch = selectedRisk === 'All' || report.risk === selectedRisk;
    const xpuMatch = xpuNeedsFixFilter === 'All' ||
      (xpuNeedsFixFilter === 'needs_fix' && report.xpu_needs_fix) ||
      (xpuNeedsFixFilter === 'no_fix' && !report.xpu_needs_fix);
    const searchMatch = !searchQuery ||
      report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.commit_hash?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && riskMatch && xpuMatch && searchMatch;
  });

  $: totalItems = filteredReports.length;
  $: totalPages = Math.ceil(totalItems / itemsPerPage);
  $: paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  async function loadData() {
    scanReportsLoading.set(true);
    scanReportsError.set(null);

    try {
      const data = await fetchScanReport({
        page: 1,
        page_size: 1000
      });
      scanReports.set(data.data || []);
    } catch (error: any) {
      scanReportsError.set(error.message || 'Failed to load data');
    } finally {
      scanReportsLoading.set(false);
    }
  }

  onMount(() => {
    if ($currentView === 'scan') {
      loadData();
    }
  });

  $: if ($currentView === 'scan' && $scanReports.length === 0 && !$scanReportsLoading) {
    loadData();
  }

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

  function getStatusIcon(status: string) {
    return statusIcons[status] || Info;
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

{#if $scanReportsLoading}
  <LoadingState message="Loading scan reports..." />
{:else if $scanReportsError}
  <EmptyState
    icon={XCircle}
    title="Error Loading Data"
    message={$scanReportsError}
  />
{:else}
  <div class="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
    <div class="flex-1 overflow-auto px-6 py-5">
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-3">
            <Shield class="w-5 h-5 text-slate-700" />
            <h2 class="text-lg font-bold text-slate-800">Scan Report</h2>
          </div>
          <div class="text-sm text-slate-600">
            Total: <span class="font-semibold text-slate-800">{totalItems}</span>
          </div>
        </div>
        <p class="text-sm text-slate-600">
          Comprehensive scan results with auto-verification status for XPU fixes
        </p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-4">
        <div class="mb-4">
          <input
            type="text"
            placeholder="Search by title, commit, author, or summary..."
            bind:value={searchQuery}
            on:input={handleFilterChange}
            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-700 mb-1.5 block">Auto Verifier Status</label>
            <div class="flex flex-wrap gap-2">
              {#each availableStatuses as status}
                <button
                  on:click={() => { selectedStatus = status; handleFilterChange(); }}
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all {
                    selectedStatus === status
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                  }"
                >
                  {status === 'All' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-700 mb-1.5 block">Risk Level</label>
            <div class="flex flex-wrap gap-2">
              {#each availableRisks as risk}
                <button
                  on:click={() => { selectedRisk = risk; handleFilterChange(); }}
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all {
                    selectedRisk === risk
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                  }"
                >
                  {risk === 'All' ? 'All' : risk.charAt(0).toUpperCase() + risk.slice(1)}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-700 mb-1.5 block">XPU Needs Fix</label>
            <div class="flex flex-wrap gap-2">
              {#each ['All', 'needs_fix', 'no_fix'] as option}
                <button
                  on:click={() => { xpuNeedsFixFilter = option; handleFilterChange(); }}
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all {
                    xpuNeedsFixFilter === option
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                  }"
                >
                  {option === 'All' ? 'All' : option === 'needs_fix' ? 'Needs Fix' : 'No Fix'}
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        {#each paginatedReports as report}
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div class="p-4">
              <div class="flex items-start justify-between gap-4 mb-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <GitCommit class="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <code class="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {report.commit_hash}
                    </code>
                  </div>
                  <h3 class="text-sm font-semibold text-slate-800 mb-1 line-clamp-2">
                    {report.title}
                  </h3>
                  <div class="flex items-center gap-3 text-xs text-slate-600">
                    <span>{report.author}</span>
                    <span>•</span>
                    <span>{formatDate(report.date)}</span>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2">
                  {#if report.auto_verifier?.status}
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-lg border {statusColors[report.auto_verifier.status] || 'text-slate-600 bg-slate-50 border-slate-200'}">
                      <svelte:component this={getStatusIcon(report.auto_verifier.status)} class="w-3.5 h-3.5 inline mr-1" />
                      {report.auto_verifier.status.toUpperCase()}
                    </span>
                  {/if}
                  {#if report.risk}
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-lg border {riskColors[report.risk] || 'text-slate-600 bg-slate-50 border-slate-200'}">
                      {report.risk.toUpperCase()} RISK
                    </span>
                  {/if}
                  {#if report.xpu_needs_fix}
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-lg border text-orange-700 bg-orange-50 border-orange-200">
                      XPU FIX NEEDED
                    </span>
                  {/if}
                </div>
              </div>

              {#if report.summary}
                <div class="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p class="text-xs text-slate-700 leading-relaxed">{report.summary}</p>
                </div>
              {/if}

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {#if report.fix_type}
                  <div class="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                    <div class="font-semibold text-blue-800 mb-1">Fix Type</div>
                    <div class="text-blue-700">
                      {report.fix_type}
                      {#if report.fix_type_confidence}
                        <span class="ml-1 text-blue-600">({report.fix_type_confidence} confidence)</span>
                      {/if}
                    </div>
                  </div>
                {/if}

                {#if report.xpu_needs_fix_confidence}
                  <div class="p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                    <div class="font-semibold text-purple-800 mb-1">XPU Fix Confidence</div>
                    <div class="text-purple-700">{report.xpu_needs_fix_confidence}</div>
                  </div>
                {/if}
              </div>

              {#if report.cuda_files && report.cuda_files.length > 0}
                <div class="mt-3 p-2.5 bg-green-50 rounded-lg border border-green-200">
                  <div class="font-semibold text-green-800 text-xs mb-1.5">CUDA Files ({report.cuda_files.length})</div>
                  <div class="flex flex-wrap gap-1.5">
                    {#each report.cuda_files.slice(0, 3) as file}
                      <code class="text-xs text-green-700 bg-white px-2 py-0.5 rounded border border-green-300">
                        {file.split('/').pop()}
                      </code>
                    {/each}
                    {#if report.cuda_files.length > 3}
                      <span class="text-xs text-green-700 px-2 py-0.5">
                        +{report.cuda_files.length - 3} more
                      </span>
                    {/if}
                  </div>
                </div>
              {/if}

              {#if report.affected_xpu_files && report.affected_xpu_files.length > 0}
                <div class="mt-3 p-2.5 bg-orange-50 rounded-lg border border-orange-200">
                  <div class="font-semibold text-orange-800 text-xs mb-1.5">Affected XPU Files ({report.affected_xpu_files.length})</div>
                  <div class="flex flex-wrap gap-1.5">
                    {#each report.affected_xpu_files.slice(0, 3) as file}
                      <code class="text-xs text-orange-700 bg-white px-2 py-0.5 rounded border border-orange-300">
                        {file.split('/').pop()}
                      </code>
                    {/each}
                    {#if report.affected_xpu_files.length > 3}
                      <span class="text-xs text-orange-700 px-2 py-0.5">
                        +{report.affected_xpu_files.length - 3} more
                      </span>
                    {/if}
                  </div>
                </div>
              {/if}

              {#if report.reason}
                <div class="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div class="font-semibold text-slate-800 text-xs mb-1">Reason</div>
                  <p class="text-xs text-slate-700 leading-relaxed">{report.reason}</p>
                </div>
              {/if}

              {#if report.suggested_fix}
                <div class="mt-3 p-2.5 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div class="font-semibold text-indigo-800 text-xs mb-1">Suggested Fix</div>
                  <p class="text-xs text-indigo-700 leading-relaxed">{report.suggested_fix}</p>
                </div>
              {/if}

              {#if report.auto_verifier}
                <div class="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div class="font-semibold text-slate-800 text-xs mb-2 flex items-center gap-2">
                    <Shield class="w-3.5 h-3.5" />
                    Auto Verifier Details
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    {#if report.auto_verifier.status_raw}
                      <div>
                        <span class="text-slate-600">Status:</span>
                        <span class="ml-1 text-slate-800 font-medium">{report.auto_verifier.status_raw}</span>
                      </div>
                    {/if}
                    {#if report.auto_verifier.confidence}
                      <div>
                        <span class="text-slate-600">Confidence:</span>
                        <span class="ml-1 text-slate-800 font-medium">{report.auto_verifier.confidence}</span>
                      </div>
                    {/if}
                    {#if report.auto_verifier.verdict_source}
                      <div>
                        <span class="text-slate-600">Verdict Source:</span>
                        <span class="ml-1 text-slate-800 font-medium">{report.auto_verifier.verdict_source}</span>
                      </div>
                    {/if}
                    {#if report.auto_verifier.script_source}
                      <div>
                        <span class="text-slate-600">Script Source:</span>
                        <span class="ml-1 text-slate-800 font-medium">{report.auto_verifier.script_source}</span>
                      </div>
                    {/if}
                    {#if report.auto_verifier.xpu_exit_code !== null && report.auto_verifier.xpu_exit_code !== undefined}
                      <div>
                        <span class="text-slate-600">XPU Exit Code:</span>
                        <span class="ml-1 text-slate-800 font-medium">{report.auto_verifier.xpu_exit_code}</span>
                      </div>
                    {/if}
                  </div>
                  {#if report.auto_verifier.verdict_reason}
                    <div class="mt-2 pt-2 border-t border-slate-200">
                      <span class="text-slate-600 text-xs">Verdict Reason:</span>
                      <p class="text-xs text-slate-700 mt-1 leading-relaxed">{report.auto_verifier.verdict_reason}</p>
                    </div>
                  {/if}
                  {#if report.auto_verifier.script_quality_warning}
                    <div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <div class="flex items-start gap-2">
                        <AlertTriangle class="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p class="text-xs text-yellow-700 leading-relaxed">{report.auto_verifier.script_quality_warning}</p>
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      {#if totalItems === 0}
        <EmptyState
          icon={FileCode}
          title="No Scan Reports"
          message="No scan reports match your current filters"
        />
      {/if}
    </div>

    {#if totalItems > 0}
      <div class="border-t border-slate-200 bg-white px-6 py-3">
        <Pagination
          {currentPage}
          {totalItems}
          {itemsPerPage}
          on:pageChange={(e) => handlePageChange(e.detail)}
          on:itemsPerPageChange={(e) => handleItemsPerPageChange(e.detail)}
        />
      </div>
    {/if}
  </div>
{/if}
