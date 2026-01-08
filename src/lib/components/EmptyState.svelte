<script lang="ts">
  import { MessageSquare, Sparkles } from 'lucide-svelte';
</script>

<div class="flex items-center justify-center min-h-[500px]">
  <div class="text-center space-y-6 max-w-md">
    <div class="flex justify-center">
      <div class="relative">
        <div class="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
          <MessageSquare class="w-12 h-12 text-slate-400" />
        </div>
        <div class="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <Sparkles class="w-4 h-4 text-white" />
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <h3 class="text-xl font-bold text-slate-800">No Data Yet</h3>
      <p class="text-sm text-slate-500">
        Start by chatting with the Orchestrator to fetch repository data.
      </p>
    </div>

    <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left">
      <p class="text-xs font-semibold text-blue-900 mb-2">Try asking:</p>
      <ul class="text-xs text-blue-700 space-y-1">
        <li>• "Fetch latest data"</li>
        <li>• "Load pytorch repository"</li>
        <li>• "Update repository data"</li>
      </ul>
    </div>

    <p class="text-xs text-slate-400">
      Click the chat button in the bottom right to get started
    </p>
  </div>
</div>
