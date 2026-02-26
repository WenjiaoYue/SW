<script lang="ts">
  import { selectedModelKey, hfModels } from "$lib/stores/appStore";
  import {
    Calendar,
    Heart,
    Download,
    TrendingUp,
    User,
    Cpu,
    Database,
    Weight,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
  } from "lucide-svelte";
  import { getMockModels } from "$lib/utils/modelProcessor";

  $: allModels = $hfModels.length > 0 ? $hfModels : getMockModels();
  $: selectedModel =
    allModels.find((m) => m.key === $selectedModelKey) || allModels[0];

  let expandedSections: Record<string, boolean> = {
    xpu: false,
    transformers: false,
    vllm: false,
  };

  $: if ($selectedModelKey) {
    expandedSections = {
      xpu: false,
      transformers: false,
      vllm: false,
    };
  }

  function toggleSection(section: string) {
    expandedSections[section] = !expandedSections[section];
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  function formatTrendingScore(score: number): string {
    return score.toFixed(1);
  }

  function getStatusInfo(status: string) {
    if (!status) {
      return {
        icon: AlertCircle,
        color: "text-slate-600",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
        label: "Unknown",
        badgeColor: "bg-slate-500",
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
        color: "text-slate-700",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
        label: "Supported",
        badgeColor: "bg-slate-700",
      };
    }

    if (
      statusLower.includes("partial") ||
      statusLower.includes("likely") ||
      statusLower.includes("limited")
    ) {
      return {
        icon: AlertCircle,
        color: "text-slate-600",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
        label: "Partial Support",
        badgeColor: "bg-slate-600",
      };
    }

    if (statusLower.includes("unclear") || statusLower.includes("unknown")) {
      return {
        icon: AlertCircle,
        color: "text-slate-600",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
        label: "Unclear",
        badgeColor: "bg-slate-600",
      };
    }

    if (
      statusLower.includes("not") ||
      statusLower.includes("block") ||
      statusLower.includes("unsupport")
    ) {
      return {
        icon: XCircle,
        color: "text-slate-500",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
        label: "Not Supported",
        badgeColor: "bg-slate-500",
      };
    }

    return {
      icon: CheckCircle2,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
      label: status,
      badgeColor: "bg-slate-600",
    };
  }
</script>

{#if selectedModel}
  <div
    class="bg-white rounded-xl border border-slate-200 shadow-card flex flex-col overflow-hidden"
  >
    <div
      class="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex-shrink-0"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <h2 class="text-lg font-bold text-slate-800 truncate">
              {selectedModel.name}
            </h2>
            {#if selectedModel.url && selectedModel.url !== "#"}
              <a
                href={selectedModel.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 hover:text-blue-700 flex-shrink-0"
              >
                <ExternalLink class="w-4 h-4" />
              </a>
            {/if}
          </div>

          <div class="flex items-center gap-3 text-xs text-slate-700 flex-wrap">
            <span class="flex items-center gap-1">
              <User class="w-3 h-3" />
              <span class="truncate max-w-[120px]">{selectedModel.author}</span>
            </span>
            <span class="flex items-center gap-1">
              <Calendar class="w-3 h-3" />
              {formatDate(selectedModel.createdAt)}
            </span>
            <span class="flex items-center gap-1">
              <Heart class="w-3 h-3" />
              {selectedModel.likes}
            </span>
            <span class="flex items-center gap-1">
              <Download class="w-3 h-3" />
              {selectedModel.downloads}
            </span>
            <span class="flex items-center gap-1">
              <TrendingUp class="w-3 h-3" />
              {formatTrendingScore(selectedModel.trendingScore)}
            </span>
          </div>
        </div>

        <div
          class="flex items-center px-3 py-1.5 rounded-full border text-xs font-bold bg-slate-100 text-slate-800 border-slate-300 flex-shrink-0"
        >
          <span class="truncate max-w-[150px]">{selectedModel.task}</span>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-5">
      <div class="space-y-4">
        {#if selectedModel.rawData}
          <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4
              class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"
            >
              <Cpu class="w-4 h-4 text-slate-600" />
              Model Details
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div
                  class="text-[10px] uppercase font-bold text-slate-500 mb-1"
                >
                  Architecture
                </div>
                <div
                  class="text-xs font-semibold text-slate-800 truncate"
                  title={selectedModel.rawData.architectures?.[0] || "N/A"}
                >
                  {selectedModel.rawData.architectures?.[0] || "N/A"}
                </div>
              </div>
              <div>
                <div
                  class="text-[10px] uppercase font-bold text-slate-500 mb-1"
                >
                  Task
                </div>
                <div
                  class="text-xs font-semibold text-slate-800 truncate"
                  title={selectedModel.task}
                >
                  {selectedModel.task}
                </div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="bg-white rounded-lg p-3 border border-slate-200">
                <div
                  class="text-[10px] uppercase font-bold text-slate-500 mb-1.5 flex items-center gap-1"
                >
                  <Database class="w-3 h-3" />
                  Model Params
                </div>
                <div class="text-lg font-bold text-slate-800">
                  {selectedModel.rawData.model_size || "N/A"}
                </div>
              </div>
              <div class="bg-white rounded-lg p-3 border border-slate-200">
                <div
                  class="text-[10px] uppercase font-bold text-slate-500 mb-1.5 flex items-center gap-1"
                >
                  <Weight class="w-3 h-3" />
                  Weight Type
                </div>
                <div class="text-lg font-bold text-slate-800">
                  {selectedModel.rawData.dtypes || "bfloat16"}
                </div>
              </div>
            </div>
          </div>

          {#if selectedModel.rawData.xpu}
            {@const xpuStatus = getStatusInfo(selectedModel.rawData.xpu.status)}
            <div
              class="relative overflow-hidden rounded-lg border {xpuStatus.borderColor} bg-white"
            >
              <button
                on:click={() => toggleSection("xpu")}
                class="w-full p-4 flex items-start justify-between hover:bg-slate-50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-slate-50 rounded-lg">
                    <Cpu class="w-4 h-4 text-slate-600" />
                  </div>
                  <div class="text-left">
                    <h3 class="text-sm font-bold text-slate-800">
                      Intel XPU Support (vLLM)
                    </h3>
                    <div class="flex items-center gap-2 mt-0.5">
                      <svelte:component
                        this={xpuStatus.icon}
                        class="w-3.5 h-3.5 {xpuStatus.color}"
                      />
                      <p class="text-xs {xpuStatus.color} font-semibold">
                        {xpuStatus.label}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="flex-shrink-0 ml-2">
                  {#if expandedSections.xpu}
                    <ChevronUp class="w-5 h-5 text-slate-400" />
                  {:else}
                    <ChevronDown class="w-5 h-5 text-slate-400" />
                  {/if}
                </div>
              </button>

              {#if expandedSections.xpu && selectedModel.rawData.xpu.details}
                <div class="px-4 pb-4 border-t border-slate-100">
                  <div
                    class="mt-4 p-3 bg-slate-50 rounded-lg max-h-48 overflow-y-auto"
                  >
                    <div
                      class="text-xs text-slate-700 whitespace-pre-wrap break-words"
                    >
                      {selectedModel.rawData.xpu.details}
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/if}

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            {#if selectedModel.rawData["huggingface/transformers"]}
              {@const tfStatus = getStatusInfo(
                selectedModel.rawData["huggingface/transformers"].status,
              )}
              <div class="rounded-lg border border-slate-200 bg-white">
                <button
                  on:click={() => toggleSection("transformers")}
                  class="w-full p-3 flex items-start justify-between hover:bg-slate-50 transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <svelte:component
                      this={tfStatus.icon}
                      class="w-4 h-4 {tfStatus.color}"
                    />
                    <div class="text-left">
                      <div class="text-xs font-bold text-slate-800">
                        Transformers
                      </div>
                      <div class="text-[10px] {tfStatus.color} font-semibold">
                        {tfStatus.label}
                      </div>
                    </div>
                  </div>
                  <div class="flex-shrink-0 ml-2">
                    {#if expandedSections.transformers}
                      <ChevronUp class="w-4 h-4 text-slate-400" />
                    {:else}
                      <ChevronDown class="w-4 h-4 text-slate-400" />
                    {/if}
                  </div>
                </button>
                {#if expandedSections.transformers && selectedModel.rawData["huggingface/transformers"].details}
                  <div class="px-3 pb-3 border-t border-slate-100">
                    <div
                      class="mt-3 p-2 bg-slate-50 rounded max-h-40 overflow-y-auto"
                    >
                      <div
                        class="text-[10px] text-slate-700 whitespace-pre-wrap break-words"
                      >
                        {selectedModel.rawData["huggingface/transformers"]
                          .details}
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            {/if}

            {#if selectedModel.rawData["vllm-project/vllm"]}
              {@const vllmStatus = getStatusInfo(
                selectedModel.rawData["vllm-project/vllm"].status,
              )}
              <div class="rounded-lg border border-slate-200 bg-white">
                <button
                  on:click={() => toggleSection("vllm")}
                  class="w-full p-3 flex items-start justify-between hover:bg-slate-50 transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <svelte:component
                      this={vllmStatus.icon}
                      class="w-4 h-4 {vllmStatus.color}"
                    />
                    <div class="text-left">
                      <div class="text-xs font-bold text-slate-800">vLLM</div>
                      <div class="text-[10px] {vllmStatus.color} font-semibold">
                        {vllmStatus.label}
                      </div>
                    </div>
                  </div>
                  <div class="flex-shrink-0 ml-2">
                    {#if expandedSections.vllm}
                      <ChevronUp class="w-4 h-4 text-slate-400" />
                    {:else}
                      <ChevronDown class="w-4 h-4 text-slate-400" />
                    {/if}
                  </div>
                </button>
                {#if expandedSections.vllm && selectedModel.rawData["vllm-project/vllm"].details}
                  <div class="px-3 pb-3 border-t border-slate-100">
                    <div
                      class="mt-3 p-2 bg-slate-50 rounded max-h-40 overflow-y-auto"
                    >
                      <div
                        class="text-[10px] text-slate-700 whitespace-pre-wrap break-words"
                      >
                        {selectedModel.rawData["vllm-project/vllm"].details}
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {:else}
          <div class="p-6 text-center text-slate-500 text-sm">
            No detailed data available for this model
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
