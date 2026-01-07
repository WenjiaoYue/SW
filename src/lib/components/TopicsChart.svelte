<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { commitFilter } from '$lib/stores/appStore';
  import { CHART_COLORS, CHART_BORDERS } from '$lib/data/constants';

  let canvas: HTMLCanvasElement;
  let chartInstance: Chart | null = null;

  Chart.register(...registerables);

  onMount(() => {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Pallas', 'ROCm', 'Inductor', 'Dynamo', 'DTensor'],
        datasets: [
          {
            label: 'Commits',
            data: [15, 8, 10, 8, 6],
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

    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  });
</script>

<div class="chart-wrapper h-[260px] relative w-full">
  <canvas bind:this={canvas}></canvas>
</div>
