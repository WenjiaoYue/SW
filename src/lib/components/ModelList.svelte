<script lang="ts">
  import { onMount } from "svelte";
  import {
    Search,
    Cpu,
    Heart,
    Download,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Filter,
    X,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
  } from "lucide-svelte";
  import {
    selectedModelKey,
    hfModels,
    hfModelsLoading,
    hfModelsError,
    hfModelsSummary,
    hfModelsLoaded,
  } from "$lib/stores/appStore";
  import { fetchHFModels } from "$lib/services/api";
  import { processHFModel, getMockModels } from "$lib/utils/modelProcessor";

  let filterText = "";
  let currentPage = 1;
  const itemsPerPage = 6;
  let showFilters = false;
  let filters = {
    minLikes: 0,
    minDownloads: 0,
  };

  type SortField = "date" | "likes" | "downloads" | null;
  type SortDirection = "asc" | "desc";
  let sortField: SortField = "likes";
  let sortDirection: SortDirection = "desc";

  function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  }

  function getStatusInfo(status: string) {
    if (!status) {
      return {
        icon: AlertCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        label: "Unknown",
      };
    }

    const statusLower = status.toLowerCase();

    if (
      statusLower.includes("support") &&
      !statusLower.includes("not") &&
      !statusLower.includes("un")
    ) {
      return {
        icon: CheckCircle2,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        label: "Supported",
      };
    }
    if (
      statusLower.includes("partial") ||
      statusLower.includes("likely") ||
      statusLower.includes("limited")
    ) {
      return {
        icon: AlertCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        label: "Partial",
      };
    }
    if (
      statusLower.includes("not") ||
      statusLower.includes("block") ||
      statusLower.includes("unsupport")
    ) {
      return {
        icon: XCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        label: "Not Supported",
      };
    }

    return {
      icon: AlertCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      label: "Unknown",
    };
  }

  function selectModel(key: string) {
    selectedModelKey.set(key);
  }

  function getXPUStatus(model: any): string {
    if (!model.rawData?.xpu) return "";
    return model.rawData.xpu.status;
  }

  async function loadModels() {
    let isLoaded = false;
    const unsubscribe = hfModelsLoaded.subscribe((value) => (isLoaded = value));
    unsubscribe();

    if (isLoaded) return;

    hfModelsLoading.set(true);
    hfModelsError.set(null);

    try {
      const response = await fetchHFModels({
        limit: 10,
        task: "text-generation",
      });

      if (!response.data || !Array.isArray(response.data)) {
        console.error("Invalid response format:", response);
        throw new Error("Invalid response format from API");
      }

      const processed = response.data.map((model, index) =>
        processHFModel(model, index),
      );

      if (processed.length === 0) {
        hfModels.set(getMockModels());
      } else {
        // ✅ 默认按 likes 倒序排序
        const sortedByLikes = [...processed].sort(
          (a, b) => (b.rawData?.likes || 0) - (a.rawData?.likes || 0),
        );

        hfModels.set(sortedByLikes);

        // ✅ 默认选中 likes 最多的 model
        selectedModelKey.set(sortedByLikes[0].key);
      }

      if (response.summary?.markdown_report) {
        hfModelsSummary.set(response.summary.markdown_report);
      }

      hfModelsLoaded.set(true);
    } catch (error) {
      console.error("Failed to load HF models:", error);
      hfModelsError.set(
        error instanceof Error ? error.message : "Failed to load models",
      );
      hfModelsLoaded.set(true);
    } finally {
      hfModelsLoading.set(false);
    }
  }

  onMount(() => {
    loadModels();
  });

  $: maxLikes = Math.max(...$hfModels.map((m) => m.rawData?.likes || 0), 1000);
  $: maxDownloads = Math.max(
    ...$hfModels.map((m) => m.rawData?.downloads || 0),
    10000,
  );

  $: filteredModels = (() => {
    let filtered = $hfModels.filter((model) => {
      const nameMatch =
        model.name.toLowerCase().includes(filterText.toLowerCase()) ||
        model.author.toLowerCase().includes(filterText.toLowerCase());

      const likesMatch = (model.rawData?.likes || 0) >= filters.minLikes;
      const downloadsMatch =
        (model.rawData?.downloads || 0) >= filters.minDownloads;

      return nameMatch && likesMatch && downloadsMatch;
    });

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortField === "date") {
          aValue = new Date(
            a.rawData?.lastModified || a.rawData?.createdAt || 0,
          ).getTime();
          bValue = new Date(
            b.rawData?.lastModified || b.rawData?.createdAt || 0,
          ).getTime();
        } else if (sortField === "likes") {
          aValue = a.rawData?.likes || 0;
          bValue = b.rawData?.likes || 0;
        } else if (sortField === "downloads") {
          aValue = a.rawData?.downloads || 0;
          bValue = b.rawData?.downloads || 0;
        }

        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }

    return filtered;
  })();

  $: totalPages = Math.ceil(filteredModels.length / itemsPerPage);

  $: paginatedModels = filteredModels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  $: {
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    }
  }

  $: if (filterText) {
    currentPage = 1;
  }

  function goToPage(page: number) {
    currentPage = page;
  }

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }

  function clearFilters() {
    filters = {
      minLikes: 0,
      minDownloads: 0,
    };
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "desc";
    }
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) return ArrowUpDown;
    return sortDirection === "asc" ? ArrowUp : ArrowDown;
  }

  $: hasActiveFilters = filters.minLikes > 0 || filters.minDownloads > 0;
</script>

<div
  class="lg:col-span-12 bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden"
>
  <div class="p-4 border-b border-slate-200 bg-slate-50/30">
    <div class="flex gap-2">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
        <input
          type="text"
          placeholder="Search models by name..."
          bind:value={filterText}
          class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 transition-all"
        />
      </div>
      <div class="flex items-center gap-2">
        {#if hasActiveFilters}
          <button
            on:click={clearFilters}
            class="px-2 py-2 text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 rounded hover:bg-slate-100 transition"
          >
            <X class="w-4 h-4" />
          </button>
        {/if}
        <button
          on:click={() => (showFilters = !showFilters)}
          class="px-3 py-2 text-xs font-medium rounded-lg border transition flex items-center gap-1.5"
          class:bg-blue-50={showFilters}
          class:border-blue-200={showFilters}
          class:text-blue-700={showFilters}
          class:bg-white={!showFilters}
          class:border-slate-200={!showFilters}
          class:text-slate-600={!showFilters}
          class:hover:bg-slate-50={!showFilters}
        >
          <Filter class="w-3.5 h-3.5" />
          Filters
          {#if hasActiveFilters}
            <span
              class="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold"
            >
              {(filters.minLikes > 0 ? 1 : 0) +
                (filters.minDownloads > 0 ? 1 : 0)}
            </span>
          {/if}
        </button>
      </div>
    </div>
  </div>

  {#if showFilters}
    <div class="px-4 py-3 bg-slate-50/50 border-b border-slate-200 space-y-4">
      <div>
        <div class="text-xs font-semibold text-slate-700 mb-2">Sort By</div>
        <div class="flex gap-2 flex-wrap">
          <button
            on:click={() => toggleSort("date")}
            class="px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center gap-1.5"
            class:bg-slate-100={sortField === "date"}
            class:border-slate-300={sortField === "date"}
            class:text-slate-800={sortField === "date"}
            class:bg-white={sortField !== "date"}
            class:border-slate-200={sortField !== "date"}
            class:text-slate-600={sortField !== "date"}
            class:hover:bg-slate-50={sortField !== "date"}
          >
            <svelte:component this={getSortIcon("date")} class="w-3.5 h-3.5" />
            Date
          </button>
          <button
            on:click={() => toggleSort("likes")}
            class="px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center gap-1.5"
            class:bg-slate-100={sortField === "likes"}
            class:border-slate-300={sortField === "likes"}
            class:text-slate-800={sortField === "likes"}
            class:bg-white={sortField !== "likes"}
            class:border-slate-200={sortField !== "likes"}
            class:text-slate-600={sortField !== "likes"}
            class:hover:bg-slate-50={sortField !== "likes"}
          >
            <svelte:component this={getSortIcon("likes")} class="w-3.5 h-3.5" />
            Likes
          </button>
          <button
            on:click={() => toggleSort("downloads")}
            class="px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center gap-1.5"
            class:bg-slate-100={sortField === "downloads"}
            class:border-slate-300={sortField === "downloads"}
            class:text-slate-800={sortField === "downloads"}
            class:bg-white={sortField !== "downloads"}
            class:border-slate-200={sortField !== "downloads"}
            class:text-slate-600={sortField !== "downloads"}
            class:hover:bg-slate-50={sortField !== "downloads"}
          >
            <svelte:component
              this={getSortIcon("downloads")}
              class="w-3.5 h-3.5"
            />
            Downloads
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-semibold text-slate-700 mb-2 block">
            Min Likes: {formatNumber(filters.minLikes)}
          </label>
          <input
            type="range"
            min="0"
            max={maxLikes}
            step={Math.max(1, Math.floor(maxLikes / 100))}
            bind:value={filters.minLikes}
            class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
          />
        </div>
        <div>
          <label class="text-xs font-semibold text-slate-700 mb-2 block">
            Min Downloads: {formatNumber(filters.minDownloads)}
          </label>
          <input
            type="range"
            min="0"
            max={maxDownloads}
            step={Math.max(1, Math.floor(maxDownloads / 100))}
            bind:value={filters.minDownloads}
            class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
          />
        </div>
      </div>
    </div>
  {/if}

  <div class="p-4 pb-0">
    {#if filteredModels.length === 0}
      <div class="flex items-center justify-center py-12">
        <div class="text-sm text-slate-500">No models found</div>
      </div>
    {:else}
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {#each paginatedModels as model}
          {@const xpuStatus = model.rawData?.xpu
            ? getStatusInfo(model.rawData.xpu.status)
            : null}
          <button
            on:click={() => selectModel(model.key)}
            class="group relative bg-white rounded-lg border hover:border-slate-300 hover:shadow-md transition-all overflow-hidden text-left"
            class:border-blue-300={$selectedModelKey === model.key}
            class:shadow-md={$selectedModelKey === model.key}
            class:ring-2={$selectedModelKey === model.key}
            class:ring-blue-100={$selectedModelKey === model.key}
            class:border-slate-200={$selectedModelKey !== model.key}
          >
            {#if $selectedModelKey === model.key}
              <div
                class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-blue-600"
              ></div>
            {/if}

            <div class="p-4" class:pl-5={$selectedModelKey === model.key}>
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1 min-w-0">
                  <h3
                    class="font-bold text-slate-800 text-sm truncate"
                    title={model.name}
                  >
                    {model.name}
                  </h3>
                  <p
                    class="text-xs text-slate-500 truncate mt-0.5"
                    title={model.author}
                  >
                    by {model.author}
                  </p>
                </div>
                {#if xpuStatus}
                  <div class="ml-2 flex-shrink-0">
                    <div class="p-1.5 rounded-lg bg-slate-100">
                      <Cpu class="w-3.5 h-3.5 text-slate-600" />
                    </div>
                  </div>
                {/if}
              </div>

              <div class="flex items-center gap-3 text-xs text-slate-600 mb-2">
                <div class="flex items-center gap-1">
                  <Heart class="w-3 h-3" />
                  <span>{formatNumber(model.likes)}</span>
                </div>
                <div class="flex items-center gap-1">
                  <Download class="w-3 h-3" />
                  <span>{formatNumber(model.downloads)}</span>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div
                  class="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"
                >
                  <TrendingUp class="w-3 h-3" />
                  <span class="font-semibold"
                    >{model.trendingScore.toFixed(1)}</span
                  >
                </div>
                {#if xpuStatus}
                  <div
                    class="text-[10px] font-semibold px-2 py-0.5 rounded border {xpuStatus.color} {xpuStatus.bgColor} {xpuStatus.borderColor}"
                  >
                    XPU
                  </div>
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>

      {#if totalPages > 1}
        <div class="flex items-center justify-end mt-4 pb-4 px-2">
          <div class="flex items-center gap-2">
            <button
              on:click={prevPage}
              disabled={currentPage === 1}
              class="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>

            <div class="flex items-center gap-1">
              {#each Array(totalPages) as _, i}
                {@const page = i + 1}
                {#if totalPages <= 7 || page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)}
                  <button
                    on:click={() => goToPage(page)}
                    class="w-8 h-8 rounded-lg text-sm font-semibold transition-colors"
                    class:bg-blue-600={currentPage === page}
                    class:text-white={currentPage === page}
                    class:hover:bg-blue-700={currentPage === page}
                    class:hover:bg-slate-100={currentPage !== page}
                    class:text-slate-700={currentPage !== page}
                  >
                    {page}
                  </button>
                {:else if page === currentPage - 2 || page === currentPage + 2}
                  <span class="text-slate-400 px-1">...</span>
                {/if}
              {/each}
            </div>

            <button
              on:click={nextPage}
              disabled={currentPage === totalPages}
              class="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
