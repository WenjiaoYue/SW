import type { HFModel } from '$lib/services/api';
import type { ProcessedModel } from '$lib/stores/appStore';
import { MODEL_DATA } from '$lib/data/constants';

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

function calculateDaysAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function generateMockMetrics(): ProcessedModel['metrics'] {
  return {
    speed: Math.floor(Math.random() * 100 + 50).toString(),
    vram: Math.floor(Math.random() * 32 + 8).toString(),
    coverage: Math.floor(Math.random() * 30 + 70) + '%',
    context: ['4k', '8k', '16k', '32k', '64k'][Math.floor(Math.random() * 5)]
  };
}

function generateMockScore(): number[] {
  return [
    Math.floor(Math.random() * 40 + 60),
    Math.floor(Math.random() * 40 + 60),
    Math.floor(Math.random() * 40 + 60),
    Math.floor(Math.random() * 40 + 60),
    Math.floor(Math.random() * 40 + 60)
  ];
}

function determineStatus(): 'Ready' | 'Partial' | 'Blocked' {
  const rand = Math.random();
  if (rand < 0.5) return 'Ready';
  if (rand < 0.85) return 'Partial';
  return 'Blocked';
}

const COLORS = ['#2563eb', '#0891b2', '#7c3aed', '#d97706', '#dc2626'];

export function processHFModel(model: HFModel, index: number): ProcessedModel {
  return {
    key: model.id,
    name: model.name,
    author: model.author,
    date: calculateDaysAgo(model.created_at),
    createdAt: model.created_at,
    likes: formatNumber(model.likes),
    downloads: formatNumber(model.downloads),
    trendingScore: model.trending_score,
    task: model.task,
    status: determineStatus(),
    score: generateMockScore(),
    color: COLORS[index % COLORS.length],
    metrics: generateMockMetrics(),
    tags: model.tags,
    url: model.url,
    rawData: model
  };
}

export function getMockModels(): ProcessedModel[] {
  return Object.entries(MODEL_DATA).map(([key, model]) => ({
    key,
    name: model.name,
    author: key,
    date: model.date,
    createdAt: new Date().toISOString(),
    likes: model.likes,
    downloads: model.downloads,
    trendingScore: Math.random() * 100,
    task: 'text-generation',
    status: model.status,
    score: model.score,
    color: model.color,
    metrics: model.metrics,
    tags: [],
    url: '#',
    rawData: null as any
  }));
}
