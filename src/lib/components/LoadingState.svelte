<script lang="ts">
  import { Loader2, Database, GitBranch, Package, Clock } from 'lucide-svelte';
  import { onMount } from 'svelte';

  let currentStep = 0;
  let elapsedSeconds = 0;

  const steps = [
    { icon: GitBranch, label: 'Fetching commits from GitHub...', color: 'text-blue-600' },
    { icon: Package, label: 'Analyzing topics and patterns...', color: 'text-green-600' },
    { icon: Database, label: 'Processing pull requests...', color: 'text-orange-600' }
  ];

  onMount(() => {
    const stepInterval = setInterval(() => {
      currentStep = (currentStep + 1) % steps.length;
    }, 3000);

    const timeInterval = setInterval(() => {
      elapsedSeconds++;
    }, 1000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(timeInterval);
    };
  });

  $: currentStepData = steps[currentStep];
</script>

<div class="flex items-center justify-center min-h-[500px]">
  <div class="text-center space-y-8 animate-fade-in max-w-md">
    <div class="relative">
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="w-32 h-32 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 animate-pulse"></div>
      </div>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="w-24 h-24 rounded-full bg-gradient-to-r from-blue-200 to-blue-100 animate-pulse" style="animation-delay: 300ms"></div>
      </div>
      <div class="relative flex items-center justify-center h-32">
        <Loader2 class="w-16 h-16 text-blue-600 animate-spin" />
      </div>
    </div>

    <div class="space-y-3">
      <h3 class="text-2xl font-bold text-slate-800">Loading Repository Data</h3>
      <div class="h-6 flex items-center justify-center">
        <div class="flex items-center gap-2 transition-all duration-500" key={currentStep}>
          <svelte:component this={currentStepData.icon} class="w-5 h-5 {currentStepData.color}" />
          <p class="text-sm font-medium {currentStepData.color}">{currentStepData.label}</p>
        </div>
      </div>
    </div>

    <div class="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div class="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-loading-bar" style="width: 70%"></div>
    </div>

    <div class="flex flex-wrap gap-3 justify-center items-center">
      {#each steps as step, i}
        <div
          class="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300"
          class:bg-blue-50={i === currentStep}
          class:border={i === currentStep}
          class:border-blue-200={i === currentStep}
        >
          <svelte:component
            this={step.icon}
            class="w-4 h-4 transition-colors {i === currentStep ? 'text-blue-600' : 'text-slate-400'}"
          />
          <span
            class="text-xs font-medium transition-colors"
            class:text-blue-600={i === currentStep}
            class:text-slate-400={i !== currentStep}
          >
            {step.label.split('...')[0]}
          </span>
        </div>
      {/each}
    </div>

    <!-- <div class="flex items-center justify-center gap-2 text-xs text-slate-400">
      <Clock class="w-3.5 h-3.5" />
      <span>Loading time: {elapsedSeconds}s</span>
    </div> -->

    <div class="flex gap-2 justify-center">
      <div class="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style="animation-delay: 0ms"></div>
      <div class="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style="animation-delay: 150ms"></div>
      <div class="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style="animation-delay: 300ms"></div>
    </div>

    <p class="text-xs text-slate-400 px-6">
      Analyzing large repositories may take 30-60 seconds. Please wait...
    </p>
  </div>
</div>

<style>
  @keyframes loading-bar {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(0%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .animate-loading-bar {
    animation: loading-bar 2s ease-in-out infinite;
  }
</style>