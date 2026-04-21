<script lang="ts">
  import { onMount } from 'svelte';
  import { potentialIssues, potentialIssuesLoading, potentialIssuesError } from '$lib/stores/appStore';
  import { fetchMarkData, postMarkData, type MarkDataRecord } from '$lib/services/api';
  import LoadingState from './LoadingState.svelte';
  import EmptyState from './EmptyState.svelte';
  import Pagination from './Pagination.svelte';
  import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Info, FileText, Tag, Loader as Loader2 } from 'lucide-svelte';

  const TASK_NAME = 'report';
  const LABEL_OPTIONS = ['false_positive', 'true_positive', 'needs_review', 'confirmed', 'wont_fix'];

  let selectedVerdict: string = 'All';
  let selectedCategory: string = 'All';
  let selectedGoal: string = 'All';
  let searchQuery: string = '';
  let currentPage = 1;
  let itemsPerPage = 10;

  let markMap: Record<string, MarkDataRecord> = {};
  let editingField: { id: string; field: 'label' | 'reason' } | null = null;
  let editValue = '';
  let savingId: string | null = null;

  $: availableVerdicts = ['All', ...Array.from(new Set($potentialIssues.map((i: any) => i.verdict).filter(Boolean)))];
  $: availableCategories = ['All', ...Array.from(new Set($potentialIssues.map((i: any) => i.report_category).filter(Boolean)))];
  $: availableGoals = ['All', ...Array.from(new Set($potentialIssues.map((i: any) => String(i.goal)).filter(Boolean)))];

  $: filtered = $potentialIssues.filter((item: any) => {
    const verdictMatch = selectedVerdict === 'All' || item.verdict === selectedVerdict;
    const categoryMatch = selectedCategory === 'All' || item.report_category === selectedCategory;
    const goalMatch = selectedGoal === 'All' || String(item.goal) === selectedGoal;
    const searchMatch = !searchQuery ||
      item.op_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.detail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sub_goal?.toLowerCase().includes(searchQuery.toLowerCase());
    return verdictMatch && categoryMatch && goalMatch && searchMatch;
  });

  $: totalItems = filtered.length;
  $: paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function handleFilterChange() { currentPage = 1; }
  function handlePageChange(page: number) { currentPage = page; }
  function handleItemsPerPageChange(n: number) { itemsPerPage = n; currentPage = 1; }

  onMount(async () => {
    try {
      const res = await fetchMarkData({ task: TASK_NAME });
      const map: Record<string, MarkDataRecord> = {};
      for (const m of res.data) { map[m.id] = m; }
      markMap = map;
    } catch { /* silent */ }
  });

  function startEdit(entryId: string, field: 'label' | 'reason') {
    const mark = markMap[entryId];
    editingField = { id: entryId, field };
    editValue = field === 'label' ? (mark?.label || '') : (mark?.reason || '');
  }

  async function commitEdit(entryId: string, field: 'label' | 'reason', value: string) {
    editingField = null;
    const mark = markMap[entryId];
    const oldValue = field === 'label' ? (mark?.label || '') : (mark?.reason || '');
    if (value === oldValue) return;

    if (field === 'label' && !value) {
      const { [entryId]: _, ...rest } = markMap;
      markMap = rest;
      return;
    }

    savingId = entryId;
    try {
      const label = field === 'label' ? value : (mark?.label || 'needs_review');
      const reason = field === 'reason' ? value : (mark?.reason || undefined);
      const res = await postMarkData({ id: entryId, label, reason, task: TASK_NAME });
      if (res.data?.[0]) {
        markMap = { ...markMap, [entryId]: res.data[0] };
      }
    } catch { /* silent */ }
    savingId = null;
  }

  function handleKeydown(e: KeyboardEvent, entryId: string, field: 'label' | 'reason') {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitEdit(entryId, field, editValue);
    } else if (e.key === 'Escape') {
      editingField = null;
    }
  }

  const verdictColors: Record<string, string> = {
    confirmed: 'text-green-700 bg-green-50 border-green-200',
    not_applicable: 'text-slate-600 bg-slate-50 border-slate-200',
    gap: 'text-red-700 bg-red-50 border-red-200',
    partial: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  };

  const labelColors: Record<string, string> = {
    false_positive: 'text-amber-700 bg-amber-50 border-amber-200',
    true_positive: 'text-red-700 bg-red-50 border-red-200',
    needs_review: 'text-blue-700 bg-blue-50 border-blue-200',
    confirmed: 'text-green-700 bg-green-50 border-green-200',
    wont_fix: 'text-slate-600 bg-slate-50 border-slate-200',
  };
</script>

{#if $potentialIssuesLoading}
  <LoadingState
    title="Loading Validation Report"
    footerText="Analyzing goal 2 & 3 results..."
    steps={[
      { icon: FileText, label: 'Fetching reports...', color: 'text-blue-600' },
      { icon: AlertTriangle, label: 'Analyzing verdicts...', color: 'text-orange-600' },
      { icon: Info, label: 'Processing details...', color: 'text-green-600' }
    ]}
  />
{:else if $potentialIssues.length === 0}
  <EmptyState
    icon={CheckCircle}
    title="No Results Found"
    message="No validation results found for the current report."
  />
{:else}
  <div class="space-y-6">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div class="flex items-center gap-4 mb-5">
        <input
          type="text"
          bind:value={searchQuery}
          on:input={handleFilterChange}
          placeholder="Search by op name, detail, or sub goal..."
          class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <div class="flex items-center gap-2 text-sm whitespace-nowrap">
          <span class="text-slate-500">Total:</span>
          <span class="font-semibold text-slate-800">{totalItems}</span>
        </div>
      </div>

      <div class="space-y-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div class="text-xs font-semibold text-slate-700 mb-1.5">Goal</div>
            <div class="flex flex-wrap gap-2">
              {#each availableGoals as g}
                <button
                  on:click={() => { selectedGoal = g; handleFilterChange(); }}
                  class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all border"
                  class:bg-slate-800={selectedGoal === g}
                  class:text-white={selectedGoal === g}
                  class:bg-white={selectedGoal !== g}
                  class:text-slate-600={selectedGoal !== g}
                  class:border-slate-300={selectedGoal !== g}
                  class:border-slate-800={selectedGoal === g}
                >
                  {g === 'All' ? 'All' : `Goal ${g}`}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <div class="text-xs font-semibold text-slate-700 mb-1.5">Verdict</div>
            <div class="flex flex-wrap gap-2">
              {#each availableVerdicts as verdict}
                <button
                  on:click={() => { selectedVerdict = verdict; handleFilterChange(); }}
                  class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all border"
                  class:bg-slate-800={selectedVerdict === verdict}
                  class:text-white={selectedVerdict === verdict}
                  class:bg-white={selectedVerdict !== verdict}
                  class:text-slate-600={selectedVerdict !== verdict}
                  class:border-slate-300={selectedVerdict !== verdict}
                  class:border-slate-800={selectedVerdict === verdict}
                >
                  {verdict.replace(/_/g, ' ')}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <div class="text-xs font-semibold text-slate-700 mb-1.5">Category</div>
            <div class="flex flex-wrap gap-2">
              {#each availableCategories as cat}
                <button
                  on:click={() => { selectedCategory = cat; handleFilterChange(); }}
                  class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all border"
                  class:bg-slate-800={selectedCategory === cat}
                  class:text-white={selectedCategory === cat}
                  class:bg-white={selectedCategory !== cat}
                  class:text-slate-600={selectedCategory !== cat}
                  class:border-slate-300={selectedCategory !== cat}
                  class:border-slate-800={selectedCategory === cat}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        {#each paginated as item}
          {@const mark = markMap[item.entry_id]}
          <div class="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all bg-white">
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-semibold text-slate-800 mb-1">{item.op_name}</h3>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Goal {item.goal}
                  </span>
                  {#if item.sub_goal}
                    <span class="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {item.sub_goal.replace(/_/g, ' ')}
                    </span>
                  {/if}
                  {#if item.report_category}
                    <span class="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {item.report_category.replace(/_/g, ' ')}
                    </span>
                  {/if}
                </div>
              </div>
              <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
                {#if item.verdict}
                  <span class="px-2.5 py-1 text-xs font-semibold rounded-lg border {verdictColors[item.verdict] || 'text-slate-600 bg-slate-50 border-slate-200'}">
                    {item.verdict.replace(/_/g, ' ').toUpperCase()}
                  </span>
                {/if}
                {#if item.confidence}
                  <span class="text-xs text-slate-500">confidence: {item.confidence}</span>
                {/if}
              </div>
            </div>

            {#if item.detail}
              <div class="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Detail</div>
                <p class="text-sm text-slate-700 leading-relaxed">{item.detail}</p>
              </div>
            {/if}

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              {#if item.xpu_evidence}
                <div class="p-2.5 bg-orange-50 rounded-lg border border-orange-200">
                  <div class="text-xs font-semibold text-orange-800 mb-1">XPU Evidence</div>
                  <p class="text-xs text-orange-700 leading-relaxed">{item.xpu_evidence}</p>
                </div>
              {/if}
              {#if item.cuda_evidence}
                <div class="p-2.5 bg-green-50 rounded-lg border border-green-200">
                  <div class="text-xs font-semibold text-green-800 mb-1">CUDA Evidence</div>
                  <p class="text-xs text-green-700 leading-relaxed">{item.cuda_evidence}</p>
                </div>
              {/if}
            </div>

            {#if item.diff_category || item.gap_category}
              <div class="mt-3 flex items-center gap-3 text-xs">
                {#if item.diff_category}
                  <span class="px-2 py-0.5 rounded bg-yellow-50 border border-yellow-200 text-yellow-700">
                    diff: {item.diff_category.replace(/_/g, ' ')}
                  </span>
                {/if}
                {#if item.gap_category}
                  <span class="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700">
                    gap: {item.gap_category.replace(/_/g, ' ')}
                  </span>
                {/if}
              </div>
            {/if}

            {#if item.verification_status}
              <div class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <span>Verification:</span>
                <span class="font-medium text-slate-700">{item.verification_status}</span>
              </div>
            {/if}

            <!-- Annotation row — always visible -->
            <div class="mt-3 pt-3 border-t border-slate-100">
              <div class="flex items-center gap-3 flex-wrap text-xs">
                <Tag class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />

                <!-- Label -->
                <span class="text-slate-500 font-medium">Label:</span>
                {#if editingField?.id === item.entry_id && editingField?.field === 'label'}
                  <select
                    class="px-2 py-1 text-xs border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    bind:value={editValue}
                    on:blur={() => commitEdit(item.entry_id, 'label', editValue)}
                    on:change={() => commitEdit(item.entry_id, 'label', editValue)}
                    autofocus
                  >
                    <option value="">not set</option>
                    {#each LABEL_OPTIONS as opt}
                      <option value={opt}>{opt.replace(/_/g, ' ')}</option>
                    {/each}
                  </select>
                {:else}
                  <!-- svelte-ignore a11y-no-static-element-interactions -->
                  <span
                    on:dblclick={() => startEdit(item.entry_id, 'label')}
                    class="px-2 py-0.5 rounded-lg border cursor-pointer select-none hover:ring-2 hover:ring-blue-300 transition-all {mark?.label ? (labelColors[mark.label] || 'text-slate-600 bg-slate-50 border-slate-200') : 'text-slate-400 bg-slate-50 border-dashed border-slate-300 italic'}"
                    title="Double-click to edit"
                  >
                    {mark?.label ? mark.label.replace(/_/g, ' ') : 'not set'}
                  </span>
                {/if}

                <span class="text-slate-300">|</span>

                <!-- Reason -->
                <span class="text-slate-500 font-medium">Reason:</span>
                {#if editingField?.id === item.entry_id && editingField?.field === 'reason'}
                  <input
                    type="text"
                    class="flex-1 min-w-[120px] max-w-xs px-2 py-1 text-xs border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    bind:value={editValue}
                    on:blur={() => commitEdit(item.entry_id, 'reason', editValue)}
                    on:keydown={(e) => handleKeydown(e, item.entry_id, 'reason')}
                    placeholder="Enter reason..."
                    autofocus
                  />
                {:else}
                  <!-- svelte-ignore a11y-no-static-element-interactions -->
                  <span
                    on:dblclick={() => startEdit(item.entry_id, 'reason')}
                    class="px-2 py-0.5 rounded-lg border cursor-pointer select-none hover:ring-2 hover:ring-blue-300 transition-all max-w-xs truncate {mark?.reason ? 'text-slate-700 bg-slate-50 border-slate-200' : 'text-slate-400 bg-slate-50 border-dashed border-slate-300 italic'}"
                    title={mark?.reason || 'Double-click to edit'}
                  >
                    {mark?.reason || 'not set'}
                  </span>
                {/if}

                <span class="text-slate-300">|</span>

                <!-- Task (read-only display) -->
                <span class="text-slate-500 font-medium">Task:</span>
                <span class="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                  {TASK_NAME}
                </span>

                <!-- Saving indicator -->
                {#if savingId === item.entry_id}
                  <Loader2 class="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
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
