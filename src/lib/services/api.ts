
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const SCAN_BASE = 'http://10.165.144.141:8000';
const LICENSE_SYCL_BASE = 'http://10.219.77.7:8000';


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
export interface ApiResponse<T> { data: T[]; total: number; }

export interface GetReportRequest { goal?: 2 | 3; verdict?: string; category?: string; sub_goal?: string; keyword?: string; }
export interface GetReportRecord {
  entry_id: string; op_name: string; goal: number; sub_goal: string; verdict: string;
  confidence: string | null; report_category: string | null; diff_category: string | null;
  gap_category: string | null; detail: string | null; xpu_evidence: string | null;
  cuda_evidence: string | null; verification_status: string | null;
  verification_notes: string[]; patterns_matched: string[]; corrections: string[];
}

export interface GetScanResultsRequest { verdict?: string; sub_goal?: string; keyword?: string; }
export interface GetScanResultsRecord {
  entry_id: string; op_name: string; goal: number; sub_goal: string; verdict: string;
  confidence: string | null; detail: string | null; xpu_evidence: string | null;
  cuda_evidence: string | null; cuda_peer_evidence: string | null;
  dec_backed_by_cuda: boolean | null; verification_status: string | null;
  verification_notes: string[]; patterns_matched: string[]; corrections: string[];
}

export interface GetScanReportRequest {
  report_days?: number; report_date?: string; source?: 'commit' | 'pr' | 'issue';
  status?: string; xpu_needs_fix?: boolean; risk?: string; is_cuda_fix?: boolean; keyword?: string;
}
export interface AutoVerifier {
  status: string | null; confidence: string | null; verdict_source: string | null;
  script_source: string | null; xpu_exit_code: number | null; xpu_timed_out: boolean | null;
  verdict_reason: string | null; repro_script: string | null; xpu_error_output: string | null;
  script_quality_warnings: string[];
}
export interface GetScanReportRecord {
  entry_id: string; source: string; report_date: string | null; report_generated_at: string | null;
  commit_hash: string | null; issue_number: number | null; title: string; author: string | null;
  date: string | null; summary: string | null; fix_type: string | null;
  fix_type_confidence: string | null; xpu_needs_fix: boolean | null;
  xpu_needs_fix_confidence: string | null; reason: string | null; risk: string | null;
  cuda_files: string[]; affected_xpu_files: string[];
  verification_status: string | null; auto_verifier: AutoVerifier | null;
}

export interface MarkDataRecord {
  id: string; label: string; reason: string | null; task: string | null;
  created_at: string; updated_at: string;
}
export interface GetMarkDataRequest { id?: string; label?: string; task?: string; }
export interface PostMarkDataRequest { id: string; label: string; reason?: string; task?: string; }

export async function fetchMarkData(req: GetMarkDataRequest = {}): Promise<ApiResponse<MarkDataRecord>> {
  try {
    return await request<ApiResponse<MarkDataRecord>>(withQuery(`${SCAN_BASE}/mark_data`, req), { method: 'GET' });
  } catch (e) {
    console.warn('mark_data GET failed');
    return { data: [], total: 0 };
  }
}

export async function postMarkData(body: PostMarkDataRequest): Promise<ApiResponse<MarkDataRecord>> {
  return request<ApiResponse<MarkDataRecord>>(`${SCAN_BASE}/mark_data`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export interface PotentialIssuesRequest { date?: string; page?: number; page_size?: number; }
export interface RepoFixesRequest { severity?: string; category?: string; page?: number; page_size?: number; }
export interface XPUSyncRequest { applicable?: boolean; category?: string; page?: number; page_size?: number; }
export interface ScanReportRequest { status?: string; xpu_needs_fix?: boolean; risk?: string; page?: number; page_size?: number; }
export interface LicenseReportRequest { scan_date?: string; scan_month?: string; severity?: string; category?: string; spdx_id?: string; page?: number; page_size?: number; }
export interface SyclReportRequest { scan_date?: string; scan_month?: string; severity?: string; category?: string; symbol?: string; file?: string; page?: number; page_size?: number; }

export interface LicenseRecord {
  file: string;
  line: number;
  severity: string;
  category: string;
  spdx_id: string | null;
  reason: string;
  suggestion: string;
  scan_id: string | null;
}

export interface SyclRecord {
  file: string;
  line: number;
  code: string | null;
  severity: string;
  category: string;
  reason: string;
  suggestion: string;
  symbol: string | null;
  llm_analysis: string | null;
  kernel: string | null;
  scan_id: string | null;
}

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
  request<any>(`${API_BASE}/triton_kernels`, { method: 'POST', body: JSON.stringify(req) });

export async function fetchGetReport(req: GetReportRequest = {}): Promise<ApiResponse<GetReportRecord>> {
  try {
    return await request<ApiResponse<GetReportRecord>>(withQuery(`${SCAN_BASE}/get_report`, req), { method: 'GET' });
  } catch (e) {
    console.warn('get_report API failed, using empty response');
    return { data: [], total: 0 };
  }
}

export async function fetchGetScanResults(req: GetScanResultsRequest = {}): Promise<ApiResponse<GetScanResultsRecord>> {
  try {
    return await request<ApiResponse<GetScanResultsRecord>>(withQuery(`${SCAN_BASE}/get_scan_results`, req), { method: 'GET' });
  } catch (e) {
    console.warn('get_scan_results API failed, using empty response');
    return { data: [], total: 0 };
  }
}

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

export async function fetchGetScanReport(req: GetScanReportRequest = {}): Promise<ApiResponse<GetScanReportRecord>> {
  try {
    return await request<ApiResponse<GetScanReportRecord>>(withQuery(`${SCAN_BASE}/get_scan_report`, req), { method: 'GET' });
  } catch (e) {
    console.warn('get_scan_report API failed, using empty response');
    return { data: [], total: 0 };
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

export async function fetchLicenseReport(req: LicenseReportRequest = {}) {
  try {
    return await request<any>(withQuery(`${LICENSE_SYCL_BASE}/get_license_report`, req), { method: 'GET' });
  } catch (e) {
    console.warn('LicenseReport API failed, using Mock Data');
    return { data: [], total: 0, page: 1, page_size: 1000 };
  }
}

export async function fetchSyclReport(req: SyclReportRequest = {}) {
  try {
    return await request<any>(withQuery(`${LICENSE_SYCL_BASE}/get_sycl_report`, req), { method: 'GET' });
  } catch (e) {
    console.warn('SyclReport API failed, using Mock Data');
    return { data: [], total: 0, page: 1, page_size: 1000 };
  }
}

export function getLicenseDownloadUrl(scanId: string): string {
  return `${LICENSE_SYCL_BASE}/download/license/${scanId}`;
}

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