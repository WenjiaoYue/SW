<script lang="ts">
  import ModelList from "./ModelList.svelte";
  import ModelRadarChart from "./ModelRadarChart.svelte";
  import LoadingState from "./LoadingState.svelte";
  import {
    hfModelsLoading,
    hfModelsError,
    hfModels,
  } from "$lib/stores/appStore";
  import {
    Cpu,
    BarChart3,
    Database,
    AlertCircle,
    Heart,
    Download,
    TrendingUp,
    CheckCircle,
  } from "lucide-svelte";

  const modelSteps = [
    {
      icon: Database,
      label: "Fetching models from API...",
      color: "text-blue-600",
    },
    {
      icon: Cpu,
      label: "Analyzing compatibility metrics...",
      color: "text-green-600",
    },
    {
      icon: BarChart3,
      label: "Processing performance data...",
      color: "text-orange-600",
    },
  ];

  $: stats = {
    total: $hfModels.length,
    xpuSupported: $hfModels.filter((m) => {
      const status = m.rawData?.xpu?.status?.toLowerCase() || "";
      return (
        status.includes("support") &&
        !status.includes("not") &&
        !status.includes("un")
      );
    }).length,
    xpuUnsupported:
      $hfModels.length -
      $hfModels.filter((m) => {
        const status = m.rawData?.xpu?.status?.toLowerCase() || "";
        return (
          status.includes("support") &&
          !status.includes("not") &&
          !status.includes("un")
        );
      }).length,
  };

  function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  }
</script>

{#if $hfModelsLoading}
  <LoadingState
    title="Loading Model Data"
    footerText="Fetching model information and compatibility metrics. Please wait..."
    steps={modelSteps}
  />
{:else if $hfModelsError}
  <div class="flex items-center justify-center h-96">
    <div class="text-center space-y-4 max-w-md">
      <AlertCircle class="w-16 h-16 text-red-500 mx-auto" />
      <h3 class="text-xl font-semibold text-slate-800">
        Failed to Load Models
      </h3>
      <p class="text-slate-600">{$hfModelsError}</p>
    </div>
  </div>
{:else}
  <div class="space-y-8 max-w-[1600px] mx-auto">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <!-- Total Models -->
      <div class="rounded-2xl bg-indigo-50 border border-indigo-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-indigo-500">Total Models</div>
            <div class="mt-1 text-3xl font-semibold text-indigo-900">
              {stats.total}
            </div>
          </div>
          <div class="p-3 rounded-xl bg-indigo-100 text-indigo-600">
            <Database class="w-6 h-6" />
          </div>
        </div>
      </div>

      <!-- XPU Supported -->
      <div class="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-emerald-600">
              XPU Supported
            </div>
            <div class="mt-1 text-3xl font-semibold text-emerald-900">
              {stats.xpuSupported}
            </div>
          </div>
          <div class="p-3 rounded-xl bg-emerald-100 text-emerald-600">
            <CheckCircle class="w-6 h-6" />
          </div>
        </div>

        <div class="mt-4">
          <div class="h-2.5 rounded-full bg-emerald-100 overflow-hidden">
            <div
              class="h-full bg-emerald-500 transition-all"
              style="width: {stats.total > 0
                ? (stats.xpuSupported / stats.total) * 100
                : 0}%"
            />
          </div>
          <div class="mt-1 text-xs text-emerald-700 font-medium">
            {stats.total > 0
              ? Math.round((stats.xpuSupported / stats.total) * 100)
              : 0}% supported
          </div>
        </div>
      </div>

      <!-- XPU Unsupported -->
      <div class="rounded-2xl bg-amber-50 border border-amber-100 p-5">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-amber-600">
              XPU Unsupported
            </div>
            <div class="mt-1 text-3xl font-semibold text-amber-900">
              {stats.xpuUnsupported}
            </div>
          </div>
          <div class="p-3 rounded-xl bg-amber-100 text-amber-600">
            <AlertCircle class="w-6 h-6" />
          </div>
        </div>

        <div class="mt-4">
          <div class="h-2.5 rounded-full bg-amber-100 overflow-hidden">
            <div
              class="h-full bg-amber-500 transition-all"
              style="width: {stats.total > 0
                ? (stats.xpuUnsupported / stats.total) * 100
                : 0}%"
            />
          </div>
          <div class="mt-1 text-xs text-amber-700 font-medium">
            {stats.total > 0
              ? Math.round((stats.xpuUnsupported / stats.total) * 100)
              : 0}% unsupported
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-5">
        <ModelList />
      </div>
      <div class="lg:col-span-7">
        <ModelRadarChart />
      </div>
    </div>
  </div>
{/if}
