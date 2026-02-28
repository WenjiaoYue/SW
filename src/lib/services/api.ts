
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const SCAN_BASE = import.meta.env.VITE_SCAN_API_BASE_URL; 


async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API Error: ${response.status}`);
  }
  return response.json();
}

function withQuery(baseUrl: string, params: Record<string, any>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) searchParams.append(key, String(val));
  });
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}


export interface TopicRequest { repo: string; days?: number; max_commits?: number; }
export interface Topic { topic_name: string; count: number; }
export interface RecentPR { title: string; url: string; number: number; topic_name: string; }
export interface CommitInfo { sha: string; message: string; author_name: string; author_email: string; author_login: string; commit_date: string; url: string; files_changed: any[]; additions: number; deletions: number; }
export interface Commit { sha: string; topic_name: string; primary_topic_id: string; topic_ids: string[]; reasoning: string; commit_info: CommitInfo; }

export interface TritonOp {
  op_name: string; high_level_category: string; backend_hint: string; likely_triton_pattern: string;
  description: string; confidence: number; torch_inductor_triton: string; official_triton: { summary: string; };
  meta: { name: string; full_name: string; func_signature: string; cuda_func: string | null; xpu_func: string | null; status: string; structured: boolean; python_module: string | null; variants: string[]; variant_name: string | null; dispatches: Record<string, string>; source_file: string; };
}

export interface APIResponse { repo: string; days: number; summary: string; topics: Topic[]; commits: Commit[]; prs: RecentPR[]; prs_analysis?: any[]; }
export interface HFModelsRequest { limit?: number; task?: string; }
export interface HFModelsResponse { data: any[]; summary?: { markdown_report?: string }; }
export interface PotentialIssuesRequest { date?: string; page?: number; page_size?: number; }
export interface RepoFixesRequest { severity?: string; category?: string; page?: number; page_size?: number; }
export interface XPUSyncRequest { applicable?: boolean; category?: string; page?: number; page_size?: number; }
export interface ScanReportRequest { status?: string; xpu_needs_fix?: boolean; risk?: string; page?: number; page_size?: number; }

export const fetchGitHubTopics = (req: TopicRequest) => 
  request<APIResponse>(`${API_BASE}/github-hot-topics`, { method: 'POST', body: JSON.stringify(req) });

export async function fetchHFModels(req: HFModelsRequest = {}): Promise<HFModelsResponse> {
  const res = await request<any>(`${API_BASE}/hf_models`, {
    method: 'POST',
    body: JSON.stringify({ limit: req.limit || 10, task: req.task || 'text-generation' }),
  });
  return { data: res.data || res, summary: res.summary };
}

export const fetchTritonInsights = (req: any) => 
  request<any>(`${API_BASE}/triton_insights`, { method: 'POST', body: JSON.stringify(req) });

export async function fetchPotentialIssues(req: PotentialIssuesRequest) {
  try {
    return await request<any>(withQuery(`${SCAN_BASE}/get_report`, req), { method: 'GET' });
  } catch (e) {
    console.warn('PotentialIssues API failed, using Mock Data');
    return MOCK_POTENTIAL_ISSUES;
  }
}

export async function fetchRepoFixes(req: RepoFixesRequest) {
  try {
    return await request<any>(withQuery(`${SCAN_BASE}/get_scan_results`, req), { method: 'GET' });
  } catch (e) {
    console.warn('RepoFixes API failed, using Mock Data');
    return MOCK_REPO_FIXES_RESPONSE;
  }
}

export async function fetchXPUSync(req: XPUSyncRequest) {
  try {
    return await request<any>(withQuery(`${SCAN_BASE}/get_cuda_fix_analysis`, req), { method: 'GET' });
  } catch (e) {
    console.warn('XPUSync API failed, using Mock Data');
    return MOCK_XPU_SYNC_RESPONSE;
  }
}

export async function fetchScanReport(req: ScanReportRequest) {
  try {
    return await request<any>(withQuery(`${SCAN_BASE}/get_scan_report`, req), { method: 'GET' });
  } catch (e) {
    console.warn('ScanReport API failed, using Mock Data');
    return MOCK_SCAN_REPORT_RESPONSE;
  }
}

export const fetchTritonOps = (): Promise<{ ops: TritonOp[] }> => 
  new Promise(res => setTimeout(() => res({ ops: MOCK_TRITON_OPS }), 500));

const MOCK_TRITON_OPS: TritonOp[] = [
  {
    op_name: "dot", high_level_category: "matmul_gemm", backend_hint: "generic", likely_triton_pattern: "matmul_block_dot",
    description: "Dot product matrix multiplication.", confidence: 0.75, torch_inductor_triton: "supported",
    official_triton: { summary: "Native support available." },
    meta: { name: "dot", full_name: "dot", func_signature: "dot(T1, T2)", cuda_func: "dot_cuda", xpu_func: null, status: "cuda_only", structured: false, python_module: null, variants: ["function"], variant_name: null, dispatches: { CUDA: "dot_cuda" }, source_file: "pytorch/aten/src/ATen/native/native_functions.yaml" }
  }
];

const MOCK_POTENTIAL_ISSUES = { data: [], total: 0, page: 1, page_size: 1000 };
const MOCK_REPO_FIXES_RESPONSE = { data: [], total: 0, page: 1, page_size: 1000 };
const MOCK_XPU_SYNC_RESPONSE = { data: [], total: 0, page: 1, page_size: 1000 };
const MOCK_SCAN_REPORT_RESPONSE = { data: [], total: 0, page: 1, page_size: 1000 };