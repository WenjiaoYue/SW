<script lang="ts">
  import ModelList from './ModelList.svelte';
  import ModelRadarChart from './ModelRadarChart.svelte';
</script>

<div class="space-y-6 max-w-7xl mx-auto transition-opacity duration-300">
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <ModelList />
    <ModelRadarChart />
  </div>
</div>
