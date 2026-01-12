<script lang="ts">
  import { CheckCircle2, AlertCircle, XCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-svelte';
  import type { FrameworkSupport } from '$lib/services/api';
  import { marked } from 'marked';

  export let framework: string;
  export let support: FrameworkSupport | undefined;
  export let isXPU: boolean = false;

  let detailsExpanded = false;

  function getStatusIcon(status: string) {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('supported')) {
      return CheckCircle2;
    } else if (lowerStatus.includes('likely') || lowerStatus.includes('partial')) {
      return AlertCircle;
    } else {
      return XCircle;
    }
  }

  function getStatusColor(status: string) {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('supported')) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (lowerStatus.includes('likely') || lowerStatus.includes('partial')) {
      return 'text-amber-600 bg-amber-50 border-amber-200';
    } else {
      return 'text-red-600 bg-red-50 border-red-200';
    }
  }

  function toggleDetails() {
    detailsExpanded = !detailsExpanded;
  }

  $: detailsHTML = support?.details ? marked.parse(support.details) : '';
</script>

{#if support}
  <div class="border rounded-lg overflow-hidden {isXPU ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200 bg-white'}">
    <div class="px-4 py-3 {isXPU ? 'bg-blue-100/50' : 'bg-slate-50'} flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="font-bold text-sm text-slate-800 {isXPU ? 'text-blue-900' : ''}">
          {framework}
        </div>
        <div class="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold border {getStatusColor(support.status)}">
          <svelte:component this={getStatusIcon(support.status)} class="w-3 h-3" />
          {support.status}
        </div>
      </div>

      {#if support.details}
        <button
          on:click={toggleDetails}
          class="text-xs text-slate-600 hover:text-slate-900 transition flex items-center gap-1 font-medium"
        >
          {detailsExpanded ? 'Hide' : 'Show'} Details
          {#if detailsExpanded}
            <ChevronUp class="w-3.5 h-3.5" />
          {:else}
            <ChevronDown class="w-3.5 h-3.5" />
          {/if}
        </button>
      {/if}
    </div>

    {#if detailsExpanded && support.details}
      <div class="px-4 py-3 border-t {isXPU ? 'border-blue-200 bg-white' : 'border-slate-200'}">
        <div class="markdown-content text-xs">
          {@html detailsHTML}
        </div>

        {#if support.issues && support.issues.length > 0}
          <div class="mt-4">
            <h4 class="text-xs font-bold text-slate-700 mb-2">Related Issues</h4>
            <div class="space-y-2">
              {#each support.issues as issue}
                <div class="bg-slate-50 rounded p-2 border border-slate-200">
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {issue.title}
                    <ExternalLink class="w-3 h-3" />
                  </a>
                  <div class="text-[10px] text-slate-600 mt-1">{issue.summary}</div>
                  <div class="text-[9px] text-slate-500 mt-1">
                    Status: <span class="font-semibold">{issue.state}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if support.pull_requests && support.pull_requests.length > 0}
          <div class="mt-4">
            <h4 class="text-xs font-bold text-slate-700 mb-2">Related Pull Requests</h4>
            <div class="space-y-2">
              {#each support.pull_requests as pr}
                <div class="bg-slate-50 rounded p-2 border border-slate-200">
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {pr.title}
                    <ExternalLink class="w-3 h-3" />
                  </a>
                  <div class="text-[10px] text-slate-600 mt-1">{pr.summary}</div>
                  <div class="text-[9px] text-slate-500 mt-1">
                    Status: <span class="font-semibold">{pr.state}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{:else}
  <div class="border border-slate-200 rounded-lg overflow-hidden bg-white">
    <div class="px-4 py-3 bg-slate-50 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="font-bold text-sm text-slate-800">{framework}</div>
        <div class="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold border text-slate-500 bg-slate-50 border-slate-300">
          <AlertCircle class="w-3 h-3" />
          No data
        </div>
      </div>
    </div>
  </div>
{/if}
