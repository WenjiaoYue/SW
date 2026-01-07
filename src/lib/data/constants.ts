export const CHART_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f43f5e', '#f59e0b'];
export const CHART_BORDERS = ['#2563eb', '#0891b2', '#7c3aed', '#e11d48', '#d97706'];

export const HOT_TOPICS_MD = `### 🚀 Summary
Development focus is skewed towards **GPU backend optimization**.

### 🔥 Active Areas
| Area | Focus |
|------|-------|
| **Pallas** | Mosaic integration |
| **ROCm** | Architecture fixes |
| **Inductor** | Float16 autotuning |

> **Note:** Pallas backend is undergoing major refactoring.`;

export interface Commit {
  hash: string;
  msg: string;
  cat: string;
}

export const COMMITS: Commit[] = [
  { hash: 'a1b2', msg: 'Integ Mosaic for GPU kernels', cat: 'Pallas' },
  { hash: 'e4f5', msg: 'Fix arch detection logic for MI300', cat: 'ROCm' },
  { hash: 'i7j8', msg: 'Autotune fix for float16 matmul', cat: 'Inductor' },
  { hash: 'm0n1', msg: 'Improve exception trace', cat: 'Dynamo' },
  { hash: 'q3r4', msg: 'CPU backend dynamic shapes support', cat: 'Pallas' },
  { hash: 'c2d3', msg: 'Dtype fix for reduction kernels', cat: 'Inductor' },
  { hash: 'z9y8', msg: 'Update Mosaic dependencies', cat: 'Pallas' },
  { hash: 'x7w6', msg: 'Fix rocm-smi parsing', cat: 'ROCm' }
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
