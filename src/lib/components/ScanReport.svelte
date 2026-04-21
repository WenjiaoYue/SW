<script lang="ts">
  import { scanReports, scanReportsLoading, scanReportsError } from '$lib/stores/appStore';
  import LoadingState from './LoadingState.svelte';
  import EmptyState from './EmptyState.svelte';
  import Pagination from './Pagination.svelte';
  import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle, Info, FileCode, GitCommitVertical as GitCommit, Shield, Hash } from 'lucide-svelte';

  let selectedStatus: string = 'All';
  let selectedRisk: string = 'All';
  let selectedSource: string = 'All';
  let searchQuery: string = '';
  let currentPage = 1;
  let itemsPerPage = 10;
  let expandedScripts: Record<string, boolean> = {};

  const statusColors: Record<string, string> = {
    immune: 'text-green-700 bg-green-50 border-green-200',
    confirmed: 'text-red-700 bg-red-50 border-red-200',
    repro_failed: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    not_started: 'text-slate-600 bg-slate-50 border-slate-200',
  };

  const riskColors: Record<string, string> = {
    low: 'text-blue-600 bg-blue-50 border-blue-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-red-600 bg-red-50 border-red-200',
  };

  const sourceColors: Record<string, string> = {
    commit: 'text-blue-700 bg-blue-50 border-blue-200',
    pr: 'text-green-700 bg-green-50 border-green-200',
    issue: 'text-orange-700 bg-orange-50 border-orange-200',
  };

  const statusIcons: Record<string, any> = {
    immune: CheckCircle,
    confirmed: XCircle,
    repro_failed: AlertTriangle,
    not_started: Info,
  };

  $: availableStatuses = ['All', ...Array.from(new Set($scanReports.map((r: any) => r.auto_verifier?.status).filter(Boolean)))];
  $: availableRisks = ['All', ...Array.from(new Set($scanReports.map((r: any) => r.risk).filter(Boolean)))];
  $: availableSources = ['All', ...Array.from(new Set($scanReports.map((r: any) => r.source).filter(Boolean)))];

  $: filteredReports = $scanReports.filter((report: any) => {
    const statusMatch = selectedStatus === 'All' || report.auto_verifier?.status === selectedStatus;
    const riskMatch = selectedRisk === 'All' || report.risk === selectedRisk;
    const sourceMatch = selectedSource === 'All' || report.source === selectedSource;
    const searchMatch = !searchQuery ||
      report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.commit_hash?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && riskMatch && sourceMatch && searchMatch;
  });

  $: totalItems = filteredReports.length;
  $: totalPages = Math.ceil(totalItems / itemsPerPage);
  $: paginatedReports = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function handlePageChange(page: number) { currentPage = page; }
  function handleItemsPerPageChange(n: number) { itemsPerPage = n; currentPage = 1; }
  function handleFilterChange() { currentPage = 1; }

  function getStatusIcon(status: string) {
    return statusIcons[status] || Info;
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }
</script>

{#if $scanReportsLoading}
  <LoadingState message="Loading scan reports..." />
{:else if $scanReportsError}
  <EmptyState icon={XCircle} title="Error Loading Data" message={$scanReportsError} />
{:else}
  <div class="space-y-6">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div class="flex items-center gap-4 mb-5">
        <input
          type="text"
          bind:value={searchQuery}
          on:input={handleFilterChange}
          placeholder="Search by title, commit hash, author, or summary..."
          class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
        />
        <div class="flex items-center gap-2 text-sm whitespace-nowrap">
          <span class="text-slate-500">Total:</span>
          <span class="font-semibold text-slate-800">{totalItems}</span>
        </div>
      </div>

      <div class="space-y-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div class="text-xs font-semibold text-slate-700 mb-1.5 block">Source</div>
            <div class="flex flex-wrap gap-2">
              {#each availableSources as source}
                <button
                  on:click={() => { selectedSource = source; handleFilterChange(); }}
                  class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all border"
                  class:bg-slate-800={selectedSource === source}
                  class:text-white={selectedSource === source}
                  class:bg-white={selectedSource !== source}
                  class:text-slate-600={selectedSource !== source}
                  class:border-slate-300={selectedSource !== source}
                  class:border-slate-800={selectedSource === source}
                >
                  {source === 'All' ? 'All' : source.toUpperCase()}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <div class="text-xs font-semibold text-slate-700 mb-1.5 block">Auto Verifier Status</div>
            <div class="flex flex-wrap gap-2">
              {#each availableStatuses as status}
                <button
                  on:click={() => { selectedStatus = status; handleFilterChange(); }}
                  class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all border"
                  class:bg-slate-800={selectedStatus === status}
                  class:text-white={selectedStatus === status}
                  class:bg-white={selectedStatus !== status}
                  class:text-slate-600={selectedStatus !== status}
                  class:border-slate-300={selectedStatus !== status}
                  class:border-slate-800={selectedStatus === status}
                >
                  {status === 'All' ? 'All' : status.replace(/_/g, ' ')}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <div class="text-xs font-semibold text-slate-700 mb-1.5 block">Risk Level</div>
            <div class="flex flex-wrap gap-2">
              {#each availableRisks as risk}
                <button
                  on:click={() => { selectedRisk = risk; handleFilterChange(); }}
                  class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all border"
                  class:bg-slate-800={selectedRisk === risk}
                  class:text-white={selectedRisk === risk}
                  class:bg-white={selectedRisk !== risk}
                  class:text-slate-600={selectedRisk !== risk}
                  class:border-slate-300={selectedRisk !== risk}
                  class:border-slate-800={selectedRisk === risk}
                >
                  {risk === 'All' ? 'All' : risk.charAt(0).toUpperCase() + risk.slice(1)}
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
                  <div class="flex items-center gap-2 mb-2 flex-wrap">
                    {#if report.source}
                      <span class="px-2 py-0.5 text-xs font-semibold rounded-lg border {sourceColors[report.source] || 'text-slate-600 bg-slate-50 border-slate-200'}">
                        {report.source.toUpperCase()}
                      </span>
                    {/if}
                    {#if report.commit_hash}
                      <div class="flex items-center gap-1">
                        <GitCommit class="w-3.5 h-3.5 text-slate-400" />
                        <code class="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {report.commit_hash.slice(0, 10)}
                        </code>
                      </div>
                    {/if}
                    {#if report.issue_number}
                      <div class="flex items-center gap-1">
                        <Hash class="w-3.5 h-3.5 text-slate-400" />
                        <span class="text-xs text-slate-600 font-mono">#{report.issue_number}</span>
                      </div>
                    {/if}
                    {#if report.report_date}
                      <span class="text-xs text-slate-400">{report.report_date}</span>
                    {/if}
                  </div>
                  <h3 class="text-sm font-semibold text-slate-800 mb-1 line-clamp-2">{report.title}</h3>
                  <div class="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    {#if report.author}<span>{report.author}</span>{/if}
                    {#if report.author && report.date}<span>•</span>{/if}
                    {#if report.date}<span>{formatDate(report.date)}</span>{/if}
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2 flex-shrink-0">
                  {#if report.auto_verifier?.status}
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-lg border {statusColors[report.auto_verifier.status] || 'text-slate-600 bg-slate-50 border-slate-200'}">
                      <svelte:component this={getStatusIcon(report.auto_verifier.status)} class="w-3.5 h-3.5 inline mr-1" />
                      {report.auto_verifier.status.replace(/_/g, ' ').toUpperCase()}
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
                        <span class="ml-1 text-blue-500">({report.fix_type_confidence})</span>
                      {/if}
                    </div>
                  </div>
                {/if}
                {#if report.xpu_needs_fix_confidence}
                  <div class="p-2.5 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div class="font-semibold text-yellow-800 mb-1">XPU Fix Confidence</div>
                    <div class="text-yellow-700">{report.xpu_needs_fix_confidence}</div>
                  </div>
                {/if}
              </div>

              {#if report.reason}
                <div class="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div class="font-semibold text-slate-700 text-xs mb-1">Reason</div>
                  <p class="text-xs text-slate-600 leading-relaxed">{report.reason}</p>
                </div>
              {/if}

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
                      <span class="text-xs text-green-600">+{report.cuda_files.length - 3} more</span>
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
                      <span class="text-xs text-orange-600">+{report.affected_xpu_files.length - 3} more</span>
                    {/if}
                  </div>
                </div>
              {/if}

              {#if report.auto_verifier}
                <div class="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div class="font-semibold text-slate-800 text-xs mb-2 flex items-center gap-2">
                    <Shield class="w-3.5 h-3.5" />
                    Auto Verifier
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    {#if report.auto_verifier.confidence}
                      <div>
                        <span class="text-slate-500">Confidence:</span>
                        <span class="ml-1 text-slate-800 font-medium">{report.auto_verifier.confidence}</span>
                      </div>
                    {/if}
                    {#if report.auto_verifier.verdict_source}
                      <div>
                        <span class="text-slate-500">Verdict Source:</span>
                        <span class="ml-1 text-slate-800 font-medium">{report.auto_verifier.verdict_source}</span>
                      </div>
                    {/if}
                    {#if report.auto_verifier.xpu_exit_code !== null && report.auto_verifier.xpu_exit_code !== undefined}
                      <div>
                        <span class="text-slate-500">XPU Exit Code:</span>
                        <span class="ml-1 text-slate-800 font-medium">{report.auto_verifier.xpu_exit_code}</span>
                      </div>
                    {/if}
                    {#if report.auto_verifier.xpu_timed_out}
                      <div>
                        <span class="text-yellow-600 font-medium">XPU Timed Out</span>
                      </div>
                    {/if}
                  </div>
                  {#if report.auto_verifier.verdict_reason}
                    <div class="mt-2 pt-2 border-t border-slate-200">
                      <span class="text-slate-500 text-xs">Verdict Reason:</span>
                      <p class="text-xs text-slate-700 mt-1 leading-relaxed">{report.auto_verifier.verdict_reason}</p>
                    </div>
                  {/if}
                  {#if report.auto_verifier.repro_script}
                    <div class="mt-2 pt-2 border-t border-slate-200">
                      <button
                        class="text-slate-600 text-xs font-semibold flex items-center gap-1 hover:text-slate-800 transition-colors"
                        on:click={() => expandedScripts[report.entry_id] = !expandedScripts[report.entry_id]}
                      >
                        <svg class="w-3.5 h-3.5 transition-transform {expandedScripts[report.entry_id] ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                        XPU Repro Script
                      </button>
                      {#if expandedScripts[report.entry_id]}
                        <pre class="text-xs mt-1 p-2 bg-slate-800 text-slate-200 rounded overflow-x-auto leading-relaxed font-mono">{report.auto_verifier.repro_script}</pre>
                      {/if}
                    </div>
                  {/if}
                  {#if report.auto_verifier.xpu_error_output}
                    <div class="mt-2 pt-2 border-t border-slate-200">
                      <span class="text-slate-600 text-xs font-semibold">XPU Error Output:</span>
                      <pre class="text-xs text-red-700 mt-1 p-2 bg-red-50 rounded overflow-x-auto leading-relaxed font-mono border border-red-200">{report.auto_verifier.xpu_error_output}</pre>
                    </div>
                  {/if}
                  {#if report.auto_verifier.script_quality_warnings && report.auto_verifier.script_quality_warnings.length > 0}
                    <div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                      {#each report.auto_verifier.script_quality_warnings as warning}
                        <div class="flex items-start gap-2">
                          <AlertTriangle class="w-3.5 h-3.5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p class="text-xs text-yellow-700 leading-relaxed">{warning}</p>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      {#if totalItems === 0}
        <EmptyState icon={FileCode} title="No Scan Reports" message="No scan reports match your current filters" />
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
