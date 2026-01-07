interface TopicRequest {
  repo: string;
  days?: number;
  max_commits?: number;
}

export interface Topic {
  id: string;
  name: string;
  summary: string;
  related_paths: string[];
  keywords: string[];
  contributors: string[];
  commit_count: number;
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

export interface APIResponse {
  repo: string;
  days: number;
  summary: string;
  topics: Topic[];
  commits: Commit[];
  pr_analysis?: any[];
}

export async function fetchGitHubTopics(request: TopicRequest): Promise<APIResponse> {
  console.log('github-hot-topics');
  
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
