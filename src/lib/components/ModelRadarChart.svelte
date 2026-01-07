<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { selectedModelKey, showModelDetail } from '$lib/stores/appStore';
  import {
    Calendar,
    Heart,
    Download,
    ListChecks,
    Radar,
    CheckCircle2,
    FileCheck,
    ArrowLeft
  } from 'lucide-svelte';
  import { MODEL_DATA, COMPATIBILITY_REPORT_MD } from '$lib/data/constants';
  import { marked } from 'marked';

  let canvas: HTMLCanvasElement;
  let radarChartInstance: Chart | null = null;
  let previousShowDetail = false;

  Chart.register(...registerables);

  $: selectedModel = MODEL_DATA[$selectedModelKey];
  $: statusBadgeClass = getStatusBadgeClass(selectedModel?.status);

  function getStatusBadgeClass(status: string | undefined): string {
    switch (status) {
      case 'Ready':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Partial':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Blocked':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  function toggleModelDetails() {
    showModelDetail.update((v) => !v);
  }

  function initializeChart() {
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not found');
      return;
    }

    // Destroy existing chart if it exists
    if (radarChartInstance) {
      radarChartInstance.destroy();
      radarChartInstance = null;
    }

    radarChartInstance = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Performance', 'Accuracy', 'XPU Ready', 'Memory Eff.', 'Context'],
        datasets: [
          {
            label: 'Score',
            data: selectedModel.score,
            backgroundColor: selectedModel.color + '33',
            borderColor: selectedModel.color,
            pointBackgroundColor: selectedModel.color,
            borderWidth: 2,
            pointBorderWidth: 2,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            angleLines: { color: '#e2e8f0' },
            grid: { color: '#e2e8f0' },
            pointLabels: {
              color: '#64748b',
              font: { size: 11, weight: '600' as const }
            },
            ticks: {
              display: false,
              stepSize: 20
            },
            min: 0,
            max: 100
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.parsed.r + '%';
              }
            }
          }
        }
      }
    });
  }

  onMount(() => {
    setTimeout(initializeChart, 100);

    return () => {
      if (radarChartInstance) {
        radarChartInstance.destroy();
      }
    };
  });

  // Reinitialize chart when returning from detail view
  $: if (previousShowDetail && !$showModelDetail) {
    setTimeout(initializeChart, 100);
  }
  $: previousShowDetail = $showModelDetail;

  $: if (radarChartInstance && selectedModel) {
    radarChartInstance.data.datasets[0].data = selectedModel.score;
    radarChartInstance.data.datasets[0].borderColor = selectedModel.color;
    radarChartInstance.data.datasets[0].pointBackgroundColor = selectedModel.color;
    radarChartInstance.data.datasets[0].backgroundColor = selectedModel.color + '33';
    radarChartInstance.update();
  }

  const compatibilityReportHTML = marked.parse(COMPATIBILITY_REPORT_MD);
</script>

<div class="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-card p-0 flex flex-col h-[560px] relative overflow-hidden">
  <div class="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
    <Radar class="w-96 h-96 text-slate-800" />
  </div>

  {#if !$showModelDetail}
    <div class="flex flex-col h-full w-full p-6 transition-all duration-300 relative z-10">
      <div class="flex justify-between items-center mb-1">
        <div class="flex flex-col">
          <h2 class="text-2xl font-bold text-slate-800">{selectedModel.name}</h2>
          <div class="flex items-center gap-3 mt-1 text-xs font-medium text-slate-600">
            <span class="flex items-center gap-1">
              <Calendar class="w-3 h-3" />
              {selectedModel.date}
            </span>
            <span class="flex items-center gap-1">
              <Heart class="w-3 h-3" />
              {selectedModel.likes}
            </span>
            <span class="flex items-center gap-1">
              <Download class="w-3 h-3" />
              {selectedModel.downloads}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            on:click={toggleModelDetails}
            class="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-lg transition-colors border border-slate-200 shadow-sm"
          >
            <ListChecks class="w-4 h-4 text-blue-600" />
            Check Compatibility
          </button>
          <div class="flex items-center px-3 py-1.5 rounded-full border text-sm font-bold {statusBadgeClass}">
            {selectedModel.status}
          </div>
        </div>
      </div>

      <div class="flex-1 flex flex-col md:flex-row gap-6 mt-2 items-start">
        <div class="w-full md:w-1/2 h-60 flex items-center justify-center">
          <canvas bind:this={canvas}></canvas>
        </div>

        <div class="w-full md:w-1/2 grid grid-cols-2 gap-3 mt-2">
          <div class="p-3 bg-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-200 flex flex-col">
            <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">Inference Speed</div>
            <div class="text-xl font-bold text-slate-800 flex items-baseline gap-1">
              <span>{selectedModel.metrics.speed}</span>
              <span class="text-xs text-slate-600 font-normal">tok/s</span>
            </div>
          </div>

          <div class="p-3 bg-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-200 flex flex-col">
            <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">Est. VRAM</div>
            <div class="text-xl font-bold text-slate-800 flex items-baseline gap-1">
              <span>{selectedModel.metrics.vram}</span>
              <span class="text-xs text-slate-600 font-normal">GB</span>
            </div>
          </div>

          <div class="p-3 bg-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-200 flex flex-col">
            <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">Kernel Coverage</div>
            <div class="text-xl font-bold text-green-600 flex items-center gap-1">
              <CheckCircle2 class="w-4 h-4" />
              <span>{selectedModel.metrics.coverage}</span>
            </div>
          </div>

          <div class="p-3 bg-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-200 flex flex-col">
            <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">Context Window</div>
            <div class="text-xl font-bold text-slate-800">
              <span>{selectedModel.metrics.context}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="flex flex-col h-full w-full p-0 transition-all duration-300 bg-white z-10">
      <div class="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
        <div>
          <h3 class="font-bold text-slate-800 flex items-center gap-2">
            <FileCheck class="w-4 h-4 text-blue-600" />
            Model Compatibility Report: <span>{selectedModel.name}</span>
          </h3>
          <p class="text-xs text-slate-600 mt-1">Detailed compatibility analysis for Intel XPU.</p>
        </div>
        <button
          on:click={toggleModelDetails}
          class="text-xs flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-50 font-medium transition-colors shadow-sm text-slate-800"
        >
          <ArrowLeft class="w-3 h-3" />
          Back to Radar
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-0">
        <div class="p-8 markdown-content max-w-4xl mx-auto">
          {@html compatibilityReportHTML}
        </div>
      </div>
    </div>
  {/if}
</div>
