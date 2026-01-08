export const CHART_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f43f5e', '#f59e0b'];
export const CHART_BORDERS = ['#2563eb', '#0891b2', '#7c3aed', '#e11d48', '#d97706'];

export const PROJECTS = [
  { id: 'pytorch', name: 'PyTorch', fullName: 'pytorch/pytorch' },
  { id: 'vllm', name: 'vLLM', fullName: 'vllm-project/vllm' },
  { id: 'sglang', name: 'SGLang', fullName: 'sgl-project/sglang' }
];

export const HOT_TOPICS_MD = `### 🚀 PyTorch Development Activity (Last 7 Days)

Recent development activity focused on **partitioner hook improvements** for custom runtime estimation.

### 🔥 Key Topics

**Partitioner Hook for Runtime Estimation**
- Feature development and reverts related to custom runtime estimation hooks in PyTorch's partitioner mechanism
- Work on supporting user-provided callables for execution time prediction
- Performance improvements showing ~2% QPS gains with custom runtime estimation

### 👥 Active Contributors
- basilwong
- pytorchmergebot

### 🏷️ Keywords
\`partitioner\` \`runtime estimation\` \`custom callable\` \`history-based estimation\` \`flops\``;

export interface Commit {
  hash: string;
  msg: string;
  cat: string;
}

export const COMMITS: Commit[] = [
  {
    hash: '0aaea43',
    msg: 'Revert "Partitioner Hook for Custom Runtime Estimation (#170739)"',
    cat: 'Partitioner Hook for Runtime Estimation'
  },
  {
    hash: '12fcedcef',
    msg: 'Partitioner Hook for Custom Runtime Estimation (#170739)',
    cat: 'Partitioner Hook for Runtime Estimation'
  }
];

export interface PullRequest {
  id: number;
  title: string;
  type: string;
  hw: string;
  reason: string;
}

export const PRS: PullRequest[] = [
  {
    id: 171753,
    title: 'config for MixOrderRed numel threshold',
    type: 'Feature',
    hw: 'Other',
    reason: 'Configurable threshold for MixOrderRed check.'
  },
  {
    id: 171820,
    title: 'Fix atomic add for MI300 architecture',
    type: 'Bug Fix',
    hw: 'AMD GPU',
    reason: 'Fixes critical atomic operation failure.'
  },
  {
    id: 171905,
    title: 'Add BlockSparse attention support',
    type: 'Feature',
    hw: 'GPU',
    reason: 'Adds support for block sparse patterns in Pallas.'
  }
];

export interface ModelMetrics {
  speed: string;
  vram: string;
  coverage: string;
  context: string;
}

export interface Model {
  name: string;
  date: string;
  likes: string;
  downloads: string;
  status: 'Ready' | 'Partial' | 'Blocked';
  score: number[];
  color: string;
  metrics: ModelMetrics;
}

export const MODEL_DATA: Record<string, Model> = {
  'Llama-3': {
    name: 'Llama-3-8B-Instruct',
    date: '2d ago',
    likes: '15.2k',
    downloads: '500k',
    status: 'Ready',
    score: [98, 90, 100, 85, 95],
    color: '#2563eb',
    metrics: { speed: '145', vram: '16', coverage: '98%', context: '8k' }
  },
  'DeepSeek': {
    name: 'DeepSeek-Coder-V2',
    date: '5d ago',
    likes: '8.5k',
    downloads: '120k',
    status: 'Partial',
    score: [70, 95, 60, 90, 80],
    color: '#d97706',
    metrics: { speed: '110', vram: '24', coverage: '85%', context: '16k' }
  },
  'Mixtral': {
    name: 'Mixtral-8x22B',
    date: '1w ago',
    likes: '12k',
    downloads: '300k',
    status: 'Blocked',
    score: [40, 60, 30, 50, 70],
    color: '#dc2626',
    metrics: { speed: 'N/A', vram: '48', coverage: '40%', context: '32k' }
  },
  'Qwen': {
    name: 'Qwen1.5-72B',
    date: '3d ago',
    likes: '9.1k',
    downloads: '180k',
    status: 'Ready',
    score: [92, 88, 95, 80, 90],
    color: '#2563eb',
    metrics: { speed: '95', vram: '40', coverage: '100%', context: '32k' }
  }
};

export const COMPATIBILITY_REPORT_MD = `### 📋 Compatibility Overview
**Status:** ✅ Fully Compatible
**Architecture:** Llama-3

This model has been verified on Intel XPU architectures.

### 🧩 Operator Support Matrix
| Component | Implementation | Status |
|---|---|---|
| **Self-Attention** | FlashAttention-v2 | ✅ Optimized |
| **Feed Forward** | Native Inductor | ✅ Compatible |
| **RMS Norm** | Triton Kernel | ✅ Optimized |

### ⚡ Performance
- **Batch Size 32:** 145 tokens/sec`;

export const MOCK_API_RESPONSE = {
  repo: 'pytorch/pytorch',
  days: 7,
  summary: `### 🚀 PyTorch Development Activity (Last 7 Days)

Recent development activity focused on **partitioner hook improvements** for custom runtime estimation.

### 🔥 Key Topics

**Partitioner Hook for Runtime Estimation**
- Feature development and reverts related to custom runtime estimation hooks in PyTorch's partitioner mechanism
- Work on supporting user-provided callables for execution time prediction
- Performance improvements showing ~2% QPS gains with custom runtime estimation

### 👥 Active Contributors
- basilwong
- pytorchmergebot

### 🏷️ Keywords
\`partitioner\` \`runtime estimation\` \`custom callable\` \`history-based estimation\` \`flops\``,
  topics: [
    {
      id: 'topic_partitioner_hook',
      name: 'Partitioner Hook for Runtime Estimation',
      summary: 'Feature development and reverts related to custom runtime estimation hooks in PyTorch\'s partitioner mechanism. Includes work on supporting user-provided callables for execution time prediction.',
      related_paths: [],
      keywords: [
        'partitioner',
        'runtime estimation',
        'custom callable',
        'history-based estimation',
        'flops'
      ],
      contributors: [
        'basilwong',
        'pytorchmergebot'
      ],
      commit_count: 2
    }
  ],
  commits: [
    {
      sha: '0aaea43fa5c94c78a6274d53f7c5343e919dfc18',
      topic_name: 'Partitioner Hook for Runtime Estimation',
      primary_topic_id: 'topic_partitioner_hook',
      topic_ids: ['topic_partitioner_hook'],
      reasoning: 'Revert commit of partitioner hook feature, explicitly references original PR #170739 about custom runtime estimation',
      commit_info: {
        sha: '0aaea43fa5c94c78a6274d53f7c5343e919dfc18',
        message: 'Revert "Partitioner Hook for Custom Runtime Estimation (#170739)"\n\nThis reverts commit 12fcedcef557852a28ce67c036b89e8343b27195.\n\nReverted https://github.com/pytorch/pytorch/pull/170739 on behalf of https://github.com/facebook-github-bot due to Diff reverted internally ([comment](https://github.com/pytorch/pytorch/pull/170739#issuecomment-3717458825))',
        author_name: 'PyTorch MergeBot',
        author_email: 'pytorchmergebot@users.noreply.github.com',
        author_login: 'pytorchmergebot',
        commit_date: '2026-01-07T06:12:04Z',
        url: 'https://github.com/pytorch/pytorch/commit/0aaea43fa5c94c78a6274d53f7c5343e919dfc18',
        files_changed: [],
        additions: 0,
        deletions: 0
      }
    },
    {
      sha: '12fcedcef557852a28ce67c036b89e8343b27195',
      topic_name: 'Partitioner Hook for Runtime Estimation',
      primary_topic_id: 'topic_partitioner_hook',
      topic_ids: ['topic_partitioner_hook'],
      reasoning: 'Implements partitioner hook feature with custom runtime estimation, contains keywords and technical details about the partitioning system',
      commit_info: {
        sha: '12fcedcef557852a28ce67c036b89e8343b27195',
        message: 'Partitioner Hook for Custom Runtime Estimation (#170739)\n\nSummary:\n## Summary\n\nThis diff adds a hook in PyTorch\'s partitioner to support **custom callable runtime estimators**.\n\n### Motivation\n\nThe existing `RUNTIME_MODE` parameter only accepts predefined string modes (e.g., `"flops"`). To enable custom runtime estimation strategies—such as history-based estimation from MAST traces—we need the partitioner to accept user-provided callables.\n\nTest Plan:\n### E2E Testing\n\nOmniFM LWB (96 B200; AC budget 0.3)\n- Baseline + Custom Kernels + FLOPS Runtime Estimation: aps-LWB_omnifmv4_1124_autoac_flop-49be42744e 164k p90 QPS (+5%), 90% peak memory\n- Baseline + Custom Kernels + History Based(**Custom**) Runtime Estimation: aps-LWB_omnifmv4_1124_autoac_lookup-aca6abaaa5 167k p90 QPS (+7%), 91% peak memory\n\nInjecting custom runtime estimation, improves QPS results by ~2%.\n\nDifferential Revision: D88714606\n\nPull Request resolved: https://github.com/pytorch/pytorch/pull/170739\nApproved by: https://github.com/jansel, https://github.com/atalman',
        author_name: 'Basil Wong',
        author_email: 'basilwong@meta.com',
        author_login: 'basilwong',
        commit_date: '2026-01-07T05:55:30Z',
        url: 'https://github.com/pytorch/pytorch/commit/12fcedcef557852a28ce67c036b89e8343b27195',
        files_changed: [],
        additions: 0,
        deletions: 0
      }
    }
  ],
  prs_analysis: []
};
