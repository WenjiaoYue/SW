<script lang="ts">
  import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-svelte';

  export let currentPage = 1;
  export let totalItems = 0;
  export let itemsPerPage = 10;
  export let onPageChange: (page: number) => void;
  export let onItemsPerPageChange: (itemsPerPage: number) => void;

  $: totalPages = Math.ceil(totalItems / itemsPerPage);
  $: startItem = (currentPage - 1) * itemsPerPage + 1;
  $: endItem = Math.min(currentPage * itemsPerPage, totalItems);

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  }

  function changeItemsPerPage(newItemsPerPage: number) {
    onItemsPerPageChange(newItemsPerPage);
    goToPage(1);
  }

  $: pageNumbers = (() => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  })();
</script>

{#if totalItems > 0}
  <div class="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-200">
    <div class="flex items-center gap-4">
      <div class="text-sm text-slate-600">
        Showing <span class="font-semibold text-slate-800">{startItem}</span> to <span class="font-semibold text-slate-800">{endItem}</span> of <span class="font-semibold text-slate-800">{totalItems}</span> items
      </div>

      <div class="flex items-center gap-2">
        <label for="items-per-page" class="text-xs text-slate-600">Per page:</label>
        <select
          id="items-per-page"
          class="px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={itemsPerPage}
          on:change={(e) => changeItemsPerPage(Number(e.currentTarget.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        on:click={() => goToPage(1)}
        disabled={currentPage === 1}
        class="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="First page"
      >
        <ChevronsLeft class="w-4 h-4" />
      </button>

      <button
        on:click={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        class="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Previous page"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <div class="flex items-center gap-1">
        {#each pageNumbers as page}
          {#if page === '...'}
            <span class="px-3 py-1.5 text-sm text-slate-400">...</span>
          {:else}
            <button
              on:click={() => goToPage(page)}
              class="min-w-[36px] px-3 py-1.5 text-sm rounded-lg border transition-colors"
              class:bg-blue-600={currentPage === page}
              class:text-white={currentPage === page}
              class:border-blue-600={currentPage === page}
              class:border-slate-300={currentPage !== page}
              class:text-slate-700={currentPage !== page}
              class:hover:bg-slate-50={currentPage !== page}
            >
              {page}
            </button>
          {/if}
        {/each}
      </div>

      <button
        on:click={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        class="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Next page"
      >
        <ChevronRight class="w-4 h-4" />
      </button>

      <button
        on:click={() => goToPage(totalPages)}
        disabled={currentPage === totalPages}
        class="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Last page"
      >
        <ChevronsRight class="w-4 h-4" />
      </button>
    </div>
  </div>
{/if}
