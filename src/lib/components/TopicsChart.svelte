<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { commitFilter } from '$lib/stores/appStore';
  import { repoData } from '$lib/stores/dataStore';
  import { CHART_COLORS, CHART_BORDERS } from '$lib/data/constants';

  let canvas: HTMLCanvasElement;
  let chartInstance: Chart | null = null;

  Chart.register(...registerables);

  function initChart() {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (chartInstance) {
      chartInstance.destroy();
    }

    const defaultData = {
      labels: ['Pallas', 'ROCm', 'Inductor', 'Dynamo', 'DTensor'],
      data: [15, 8, 10, 8, 6]
    };

    let chartLabels = defaultData.labels;
    let chartData = defaultData.data;

    if ($repoData?.topics && $repoData.topics.length > 0) {
      const sortedTopics = [...$repoData.topics]
        .sort((a, b) => b.commit_count - a.commit_count)
        .slice(0, 5);

      if (sortedTopics.length > 0) {
        chartLabels = sortedTopics.map(topic => topic.name);
        chartData = sortedTopics.map(topic => topic.commit_count);
      }
    }

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: 'Commits',
            data: chartData,
            backgroundColor: CHART_COLORS,
            borderColor: CHART_BORDERS,
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 32
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            grid: {
              color: '#e2e8f0'
            },
            ticks: { color: '#94a3b8' }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#64748b',
              font: { weight: '600' as const }
            }
          }
        },
        onClick: (e, elements) => {
          if (elements.length > 0 && chartInstance) {
            const index = elements[0].index;
            const label = chartInstance.data.labels?.[index] as string;
            commitFilter.set(label);
          } else {
            commitFilter.set('All');
          }
        },
        onHover: (e, elements) => {
          const target = e.native?.target as HTMLElement;
          if (target) {
            target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
          }
        }
      }
    });
  }

  onMount(() => {
    initChart();

    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  });

  $: if (chartInstance && $repoData) {
    initChart();
  }
</script>

<div class="chart-wrapper h-[260px] relative w-full">
  <canvas bind:this={canvas}></canvas>
</div>
