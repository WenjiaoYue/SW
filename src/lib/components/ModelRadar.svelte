<script lang="ts">
  import ModelList from './ModelList.svelte';
  import ModelRadarChart from './ModelRadarChart.svelte';
  import LoadingState from './LoadingState.svelte';
  import { hfModelsLoading } from '$lib/stores/appStore';
  import { Cpu, BarChart3, Database } from 'lucide-svelte';

  const modelSteps = [
    { icon: Database, label: 'Fetching models from API...', color: 'text-blue-600' },
    { icon: Cpu, label: 'Analyzing compatibility metrics...', color: 'text-green-600' },
    { icon: BarChart3, label: 'Processing performance data...', color: 'text-orange-600' }
  ];
</script>

{#if $hfModelsLoading}
  <LoadingState
    title="Loading Model Data"
    footerText="Fetching model information and compatibility metrics. Please wait..."
    steps={modelSteps}
  />
{:else}
  <div class="space-y-6 max-w-7xl mx-auto transition-opacity duration-300">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <ModelList />
      <ModelRadarChart />
    </div>
  </div>
{/if}
