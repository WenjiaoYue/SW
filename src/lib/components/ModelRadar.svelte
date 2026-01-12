<script lang="ts">
  import ModelList from './ModelList.svelte';
  import ModelRadarChart from './ModelRadarChart.svelte';
  import LoadingState from './LoadingState.svelte';
  import { hfModelsLoading, hfModelsError, hfModels } from '$lib/stores/appStore';
  import { Cpu, BarChart3, Database, AlertCircle, Heart, Download, TrendingUp, CheckCircle } from 'lucide-svelte';

  const modelSteps = [
    { icon: Database, label: 'Fetching models from API...', color: 'text-blue-600' },
    { icon: Cpu, label: 'Analyzing compatibility metrics...', color: 'text-green-600' },
    { icon: BarChart3, label: 'Processing performance data...', color: 'text-orange-600' }
  ];

  $: stats = {
    total: $hfModels.length,
    xpuSupported: $hfModels.filter(m => {
      const status = m.rawData?.xpu?.status?.toLowerCase() || '';
      return status.includes('support') && !status.includes('not') && !status.includes('un');
    }).length,
    totalLikes: $hfModels.reduce((sum, m) => sum + (m.rawData?.likes || 0), 0),
    totalDownloads: $hfModels.reduce((sum, m) => sum + (m.rawData?.downloads || 0), 0),
    avgTrending: $hfModels.length > 0
      ? ($hfModels.reduce((sum, m) => sum + (m.trendingScore || 0), 0) / $hfModels.length).toFixed(1)
      : '0.0'
  };

  function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
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
      <h3 class="text-xl font-semibold text-slate-800">Failed to Load Models</h3>
      <p class="text-slate-600">{$hfModelsError}</p>
    </div>
  </div>
{:else}
  <div class="space-y-6 max-w-[1600px] mx-auto transition-opacity duration-300">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
        <div class="flex items-center justify-between mb-3">
          <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Database class="w-5 h-5" />
          </div>
          <span class="text-2xl font-bold">{stats.total}</span>
        </div>
        <div class="text-blue-100 text-sm font-medium">Total Models</div>
      </div>

      <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
        <div class="flex items-center justify-between mb-3">
          <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <CheckCircle class="w-5 h-5" />
          </div>
          <span class="text-2xl font-bold">{stats.xpuSupported}</span>
        </div>
        <div class="text-green-100 text-sm font-medium">XPU Supported</div>
        <div class="mt-2 flex items-center gap-2">
          <div class="flex-1 bg-white/20 rounded-full h-1.5">
            <div class="bg-white rounded-full h-1.5 transition-all" style="width: {stats.total > 0 ? (stats.xpuSupported / stats.total * 100) : 0}%"></div>
          </div>
          <span class="text-xs font-semibold">{stats.total > 0 ? Math.round(stats.xpuSupported / stats.total * 100) : 0}%</span>
        </div>
      </div>

      <div class="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-5 text-white shadow-lg">
        <div class="flex items-center justify-between mb-3">
          <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Heart class="w-5 h-5" />
          </div>
          <span class="text-2xl font-bold">{formatNumber(stats.totalLikes)}</span>
        </div>
        <div class="text-pink-100 text-sm font-medium">Total Likes</div>
      </div>

      <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
        <div class="flex items-center justify-between mb-3">
          <div class="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Download class="w-5 h-5" />
          </div>
          <span class="text-2xl font-bold">{formatNumber(stats.totalDownloads)}</span>
        </div>
        <div class="text-orange-100 text-sm font-medium">Total Downloads</div>
      </div>
    </div>

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
