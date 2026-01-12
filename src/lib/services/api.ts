interface TopicRequest {
  repo: string;
  days?: number;
  max_commits?: number;
}

export interface Topic {
  topic_name: string;
  count: number;
}

export interface RecentPR {
  title: string;
  url: string;
  number: number;
  topic_name: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author_name: string;
  author_email: string;
  author_login: string;
  commit_date: string;
  url: string;
  files_changed: any[];
  additions: number;
  deletions: number;
}

export interface Commit {
  sha: string;
  topic_name: string;
  primary_topic_id: string;
  topic_ids: string[];
  reasoning: string;
  commit_info: CommitInfo;
}

export interface PullRequest {
  number: number;
  title: string;
  url: string;
  xpu_relevance_score: number;
  xpu_relevance_justification: any;
  body: string;
  submitter: string;
  state: string;
  tags: string[];
  created_at: string;
  hardware: string;
  types: string[];
  reasoning: string;
  author?: string;
  merged_at?: string | null;
  labels?: string[];
  diff_summary?: any;
}

export interface APIResponse {
  repo: string;
  days: number;
  summary: string;
  topics: Topic[];
  commits: Commit[];
  prs: RecentPR[];
  prs_analysis?: PullRequest[];
}

export async function fetchGitHubTopics(request: TopicRequest): Promise<APIResponse> {
  const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/github-hot-topics`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch GitHub topics');
  }

  return response.json();
}

export interface FrameworkIssue {
  url: string;
  state: string;
  title: string;
  summary: string;
}

export interface FrameworkPR {
  url: string;
  state: string;
  title: string;
  summary: string;
}

export interface FrameworkSupport {
  status: string;
  details: string;
  issues?: FrameworkIssue[];
  pull_requests?: FrameworkPR[];
}

export interface HFModel {
  id: string;
  link: string;
  author: string;
  created_at: string;
  downloads: number;
  likes: number;
  task: string;
  tags: string[];
  trending_score: number;
  model_size: string;
  architectures: string[];
  'huggingface/transformers'?: FrameworkSupport;
  'vllm-project/vllm'?: FrameworkSupport;
  xpu?: FrameworkSupport;
}

export interface HFModelsRequest {
  limit?: number;
  task?: string;
}

export interface HFModelsResponse {
  data: HFModel[];
  summary?: {
    markdown_report?: string;
  };
}

export async function fetchHFModels(request: HFModelsRequest = {}): Promise<HFModelsResponse> {
  const apiUrl = 'http://10.7.4.144:5137/hf_models';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      limit: request.limit || 10,
      task: request.task || 'text-generation',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch HF models');
  }

  const result = await response.json();

  return {
    data: result.data || result,
    summary: result.summary
  };
}
