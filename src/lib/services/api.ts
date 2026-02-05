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

export interface TritonOp {
  op_name: string;
  high_level_category: string;
  backend_hint: string;
  likely_triton_pattern: string;
  description: string;
  confidence: number;
  torch_inductor_triton: string;
  official_triton: {
    summary: string;
  };
  meta: {
    name: string;
    full_name: string;
    func_signature: string;
    cuda_func: string | null;
    xpu_func: string | null;
    status: string;
    structured: boolean;
    python_module: string | null;
    variants: string[];
    variant_name: string | null;
    dispatches: Record<string, string>;
    source_file: string;
  };
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
  triton_ops?: TritonOp[];
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

export interface TritonOpsResponse {
  ops: TritonOp[];
}

const MOCK_TRITON_OPS: TritonOp[] = [
  {
    op_name: "dot",
    high_level_category: "matmul_gemm",
    backend_hint: "generic",
    likely_triton_pattern: "matmul_block_dot",
    description: "Dot product is a core vector/matrix multiplication primitive, typically implemented via optimized GEMM-style kernels. TorchInductor likely lowers this to tl.dot-like matmul templates.",
    confidence: 0.75,
    torch_inductor_triton: "supported",
    official_triton: { summary: "Triton provides native support for dot operations with optimized GEMM kernels" },
    meta: {
      name: "dot",
      full_name: "dot",
      func_signature: "dot(Tensor self, Tensor tensor) -> Tensor",
      cuda_func: "dot_cuda",
      xpu_func: null,
      status: "cuda_only",
      structured: false,
      python_module: null,
      variants: ["function", "method"],
      variant_name: null,
      dispatches: {
        CPU: "dot",
        CUDA: "dot_cuda",
        MPS: "dot_mps"
      },
      source_file: "pytorch/aten/src/ATen/native/native_functions.yaml"
    }
  },
  {
    op_name: "addmm",
    high_level_category: "matmul_gemm",
    backend_hint: "generic",
    likely_triton_pattern: "matmul_addmm",
    description: "Addmm performs matrix multiplication followed by addition (out = beta*input + alpha*(mat1@mat2)). This is a fundamental BLAS operation commonly used in neural network layers.",
    confidence: 0.9,
    torch_inductor_triton: "supported",
    official_triton: { summary: "Full support with optimized fusion of matmul and element-wise add" },
    meta: {
      name: "addmm",
      full_name: "addmm",
      func_signature: "addmm(Tensor self, Tensor mat1, Tensor mat2, *, Scalar beta=1, Scalar alpha=1) -> Tensor",
      cuda_func: "addmm_cuda",
      xpu_func: "addmm_xpu",
      status: "both",
      structured: false,
      python_module: null,
      variants: ["function", "method"],
      variant_name: null,
      dispatches: {
        CPU: "addmm_cpu",
        CUDA: "addmm_cuda",
        XPU: "addmm_xpu"
      },
      source_file: "pytorch/aten/src/ATen/native/native_functions.yaml"
    }
  },
  {
    op_name: "conv2d",
    high_level_category: "convolution",
    backend_hint: "cudnn",
    likely_triton_pattern: "conv_implicit_gemm",
    description: "2D convolution operation, fundamental for CNNs. TorchInductor may lower this to implicit GEMM-based Triton kernels for certain shapes.",
    confidence: 0.65,
    torch_inductor_triton: "supported",
    official_triton: { summary: "Supported via implicit GEMM transformations for specific configurations" },
    meta: {
      name: "conv2d",
      full_name: "conv2d",
      func_signature: "conv2d(Tensor input, Tensor weight, Tensor? bias=None, int[2] stride=1, int[2] padding=0, int[2] dilation=1, int groups=1) -> Tensor",
      cuda_func: "conv2d_cuda",
      xpu_func: "conv2d_xpu",
      status: "both",
      structured: true,
      python_module: null,
      variants: ["function"],
      variant_name: null,
      dispatches: {
        CPU: "conv2d_cpu",
        CUDA: "conv2d_cuda",
        XPU: "conv2d_xpu",
        MPS: "conv2d_mps"
      },
      source_file: "pytorch/aten/src/ATen/native/native_functions.yaml"
    }
  },
  {
    op_name: "softmax",
    high_level_category: "normalization",
    backend_hint: "generic",
    likely_triton_pattern: "reduction_softmax",
    description: "Softmax normalization applies exp and division along a dimension. Triton typically implements this via fused reduction kernels for efficiency.",
    confidence: 0.85,
    torch_inductor_triton: "supported",
    official_triton: { summary: "Efficient implementation using block-level reductions and online algorithms" },
    meta: {
      name: "softmax",
      full_name: "softmax",
      func_signature: "softmax(Tensor self, int dim, ScalarType? dtype=None) -> Tensor",
      cuda_func: "softmax_cuda",
      xpu_func: "softmax_xpu",
      status: "both",
      structured: false,
      python_module: null,
      variants: ["function", "method"],
      variant_name: null,
      dispatches: {
        CPU: "softmax_cpu",
        CUDA: "softmax_cuda",
        XPU: "softmax_xpu"
      },
      source_file: "pytorch/aten/src/ATen/native/native_functions.yaml"
    }
  },
  {
    op_name: "layer_norm",
    high_level_category: "normalization",
    backend_hint: "generic",
    likely_triton_pattern: "reduction_layernorm",
    description: "Layer normalization computes mean and variance across features and normalizes. Requires efficient reduction and element-wise operations.",
    confidence: 0.8,
    torch_inductor_triton: "supported",
    official_triton: { summary: "Optimized with welford reduction and fused element-wise operations" },
    meta: {
      name: "layer_norm",
      full_name: "layer_norm",
      func_signature: "layer_norm(Tensor input, int[] normalized_shape, Tensor? weight=None, Tensor? bias=None, float eps=1e-05, bool cudnn_enable=True) -> Tensor",
      cuda_func: "layer_norm_cuda",
      xpu_func: "layer_norm_xpu",
      status: "both",
      structured: true,
      python_module: null,
      variants: ["function"],
      variant_name: null,
      dispatches: {
        CPU: "layer_norm_cpu",
        CUDA: "layer_norm_cuda",
        XPU: "layer_norm_xpu"
      },
      source_file: "pytorch/aten/src/ATen/native/native_functions.yaml"
    }
  },
  {
    op_name: "gelu",
    high_level_category: "activation",
    backend_hint: "generic",
    likely_triton_pattern: "elementwise_unary",
    description: "Gaussian Error Linear Unit activation function. Simple element-wise operation that's easily fused in Triton kernels.",
    confidence: 0.9,
    torch_inductor_triton: "supported",
    official_triton: { summary: "Implemented as element-wise kernel with optional approximation modes" },
    meta: {
      name: "gelu",
      full_name: "gelu",
      func_signature: "gelu(Tensor self, *, str approximate='none') -> Tensor",
      cuda_func: "gelu_cuda",
      xpu_func: "gelu_xpu",
      status: "both",
      structured: false,
      python_module: null,
      variants: ["function", "method"],
      variant_name: null,
      dispatches: {
        CPU: "gelu_cpu",
        CUDA: "gelu_cuda",
        XPU: "gelu_xpu"
      },
      source_file: "pytorch/aten/src/ATen/native/native_functions.yaml"
    }
  },
  {
    op_name: "flash_attention",
    high_level_category: "attention",
    backend_hint: "flash_attn",
    likely_triton_pattern: "flash_attention_fwd",
    description: "Flash Attention implements memory-efficient attention mechanism using tiling and online softmax. Critical for large language models.",
    confidence: 0.95,
    torch_inductor_triton: "supported",
    official_triton: { summary: "Full implementation available with forward and backward passes, supporting various head dimensions" },
    meta: {
      name: "flash_attention",
      full_name: "flash_attention_forward",
      func_signature: "flash_attention_forward(Tensor q, Tensor k, Tensor v, float dropout_p=0.0, float softmax_scale=None, bool causal=False) -> Tensor",
      cuda_func: "flash_attention_cuda",
      xpu_func: null,
      status: "cuda_only",
      structured: true,
      python_module: "torch.nn.functional",
      variants: ["function"],
      variant_name: null,
      dispatches: {
        CUDA: "flash_attention_cuda"
      },
      source_file: "pytorch/aten/src/ATen/native/native_functions.yaml"
    }
  },
  {
    op_name: "bmm",
    high_level_category: "matmul_gemm",
    backend_hint: "cublas",
    likely_triton_pattern: "matmul_batched",
    description: "Batched matrix multiplication performs multiple independent matrix products in parallel. Essential for transformer architectures.",
    confidence: 0.85,
    torch_inductor_triton: "supported",
    official_triton: { summary: "Supported with batch dimension handling in block-based matmul kernels" },
    meta: {
      name: "bmm",
      full_name: "bmm",
      func_signature: "bmm(Tensor self, Tensor mat2) -> Tensor",
      cuda_func: "bmm_cuda",
      xpu_func: "bmm_xpu",
      status: "both",
      structured: false,
      python_module: null,
      variants: ["function", "method"],
      variant_name: null,
      dispatches: {
        CPU: "bmm_cpu",
        CUDA: "bmm_cuda",
        XPU: "bmm_xpu"
      },
      source_file: "pytorch/aten/src/ATen/native/native_functions.yaml"
    }
  },
  {
    op_name: "embedding",
    high_level_category: "indexing",
    backend_hint: "generic",
    likely_triton_pattern: "gather_embedding",
    description: "Embedding lookup performs gather operation to fetch embedding vectors by indices. Can be optimized with coalesced memory access patterns.",
    confidence: 0.7,
    torch_inductor_triton: "supported",
    official_triton: { summary: "Supported through optimized gather operations with configurable cache strategies" },
    meta: {
      name: "embedding",
      full_name: "embedding",
      func_signature: "embedding(Tensor weight, Tensor indices, int padding_idx=-1, bool scale_grad_by_freq=False, bool sparse=False) -> Tensor",
      cuda_func: "embedding_cuda",
      xpu_func: null,
      status: "cuda_only",
      structured: false,
      python_module: "torch.nn.functional",
      variants: ["function"],
      variant_name: null,
      dispatches: {
        CPU: "embedding_cpu",
        CUDA: "embedding_cuda"
      },
      source_file: "pytorch/aten/src/ATen/native/native_functions.yaml"
    }
  },
  {
    op_name: "dropout",
    high_level_category: "regularization",
    backend_hint: "generic",
    likely_triton_pattern: "elementwise_dropout",
    description: "Dropout randomly zeros elements during training for regularization. Can be fused with other operations in Triton kernels.",
    confidence: 0.88,
    torch_inductor_triton: "supported",
    official_triton: { summary: "Implemented with efficient random number generation and element-wise masking" },
    meta: {
      name: "dropout",
      full_name: "dropout",
      func_signature: "dropout(Tensor input, float p=0.5, bool training=True) -> Tensor",
      cuda_func: "dropout_cuda",
      xpu_func: "dropout_xpu",
      status: "both",
      structured: false,
      python_module: "torch.nn.functional",
      variants: ["function"],
      variant_name: null,
      dispatches: {
        CPU: "dropout_cpu",
        CUDA: "dropout_cuda",
        XPU: "dropout_xpu"
      },
      source_file: "pytorch/aten/src/ATen/native/native_functions.yaml"
    }
  }
];

export interface TritonInsight {
  op: string;
  torch_op_insights: string;
  torch_inductor_insights: string;
  triton_insights: string;
}

export interface TritonInsightsRequest {
  repo: string;
  days?: number;
  max_commits?: number;
}

export interface TritonInsightsResponse {
  data: TritonInsight[];
}

export async function fetchTritonInsights(request: TritonInsightsRequest): Promise<TritonInsightsResponse> {
  const apiUrl = 'http://10.7.4.144:5137/triton_insights';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch Triton insights');
  }

  return response.json();
}

export async function fetchTritonOps(): Promise<TritonOpsResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ops: MOCK_TRITON_OPS
      });
    }, 500);
  });
}

export interface PotentialIssue {
  op_name: string;
  category: string;
  severity: string;
  details: string[];
  cuda_dtypes: string[];
  xpu_dtypes: string[];
  recommendation: string[];
  cuda_file: string | null;
  xpu_file: string | null;
}

export interface PotentialIssuesRequest {
  date: string;
}

export interface PotentialIssuesResponse {
  data: PotentialIssue[];
}

const MOCK_POTENTIAL_ISSUES: PotentialIssuesResponse = {
  data: [
    {
      op_name: "baddbmm.dtype",
      category: "validation_gap",
      severity: "high",
      details: [
        "1. The XPU implementation performs only minimal dtype validation behavior with non-standard memory layouts.",
        "2. CUDA implementation includes additional boundary checks for tensor dimensions."
      ],
      cuda_dtypes: ["float32", "float16", "bfloat16"],
      xpu_dtypes: ["float32", "float16"],
      recommendation: [
        "1. Enhance the XPU implementation's dtype validation by incorporating the full set of checks performed before calling `xpu::baddbmm_out`.",
        "2. Add comprehensive test coverage for edge cases with non-standard memory layouts."
      ],
      cuda_file: "aten/src/ATen/native/cuda/Blas.cu",
      xpu_file: "src/ATen/native/xpu/sycl/BlasKernels.cpp"
    },
    {
      op_name: "scaled_dot_product_attention",
      category: "performance_gap",
      severity: "medium",
      details: [
        "1. XPU implementation uses a generic kernel path for certain input configurations.",
        "2. CUDA utilizes Flash Attention optimizations for better memory efficiency."
      ],
      cuda_dtypes: ["float32", "float16", "bfloat16"],
      xpu_dtypes: ["float32", "float16"],
      recommendation: [
        "1. Implement Flash Attention optimizations for XPU backend.",
        "2. Add specialized kernel paths for common input patterns."
      ],
      cuda_file: "aten/src/ATen/native/cuda/sdpa.cu",
      xpu_file: "src/ATen/native/xpu/sycl/AttentionKernels.cpp"
    },
    {
      op_name: "group_norm",
      category: "validation_gap",
      severity: "critical",
      details: [
        "1. Missing input validation for group count divisibility.",
        "2. No checks for negative tensor dimensions in XPU implementation."
      ],
      cuda_dtypes: ["float32", "float16"],
      xpu_dtypes: ["float32"],
      recommendation: [
        "1. Add input validation to ensure number of channels is divisible by number of groups.",
        "2. Implement dimension validation checks before kernel launch."
      ],
      cuda_file: "aten/src/ATen/native/cuda/group_norm.cu",
      xpu_file: "src/ATen/native/xpu/sycl/NormalizationKernels.cpp"
    }
  ]
};

export async function fetchPotentialIssues(request: PotentialIssuesRequest): Promise<PotentialIssuesResponse> {
  const apiUrl = 'http://127.0.0.1:8000/get_report';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch potential issues');
    }

    return response.json();
  } catch (error) {
    console.warn('API call failed, using mock data:', error);
    return MOCK_POTENTIAL_ISSUES;
  }
}

export interface RepoFixIssue {
  file: string;
  line: number;
  code: string;
  severity: string;
  category: string;
  reason: string;
  suggestion: string;
  cuda_validated: boolean;
  cuda_has_same_issue: boolean | null;
  adjusted_severity: string | null;
  validation_reason: string;
  op_name: string | null;
  cuda_file: string | null;
  cuda_function: string | null;
  scanned_at: string;
}

const MOCK_REPO_FIXES: RepoFixIssue[] = [
  {
    file: "/home/sdp/jyz/torch-xpu-ops/src/ATen/native/xpu/sycl/BatchNormKernels.cpp",
    line: 65,
    code: "(self.is_contiguous() && self.strides()[1] == 1)",
    severity: "critical",
    category: "ptr-calc",
    reason: "Out-of-bounds stride access: self.strides()[1] can crash on 0D, 1D, or 2D tensors.",
    suggestion: "Add a dimension guard before accessing strides: (self.ndimension() >= 2 && self.is_contiguous() && self.strides()[1] == 1)",
    cuda_validated: false,
    cuda_has_same_issue: null,
    adjusted_severity: null,
    validation_reason: "",
    op_name: "batch_norm",
    cuda_file: null,
    cuda_function: null,
    scanned_at: "2026-02-03T07:12:25.082268+00:00"
  },
  {
    file: "/home/sdp/jyz/torch-xpu-ops/src/ATen/native/xpu/sycl/IndexKernels.cpp",
    line: 120,
    code: "auto ptr = data + offset;",
    severity: "high",
    category: "ptr-calc",
    reason: "Potential pointer overflow in offset calculation.",
    suggestion: "Use safe_math or check offset limits before pointer arithmetic.",
    cuda_validated: true,
    cuda_has_same_issue: false,
    adjusted_severity: "medium",
    validation_reason: "CUDA handles this with specific guard bands in the kernel launch logic.",
    op_name: "index_select",
    cuda_file: "IndexKernels.cu",
    cuda_function: "index_select_kernel",
    scanned_at: "2026-02-04T09:30:00.000000+00:00"
  },
  {
    file: "/home/sdp/jyz/torch-xpu-ops/src/ATen/native/xpu/sycl/ConvolutionKernels.cpp",
    line: 234,
    code: "input.data_ptr<float>() + batch_offset",
    severity: "medium",
    category: "ptr-calc",
    reason: "Unchecked pointer offset calculation may lead to out-of-bounds access.",
    suggestion: "Validate batch_offset is within tensor bounds before performing pointer arithmetic.",
    cuda_validated: true,
    cuda_has_same_issue: true,
    adjusted_severity: "medium",
    validation_reason: "Both CUDA and XPU have this pattern. Consider fixing in both implementations.",
    op_name: "conv2d",
    cuda_file: "ConvolutionKernels.cu",
    cuda_function: "conv2d_forward_kernel",
    scanned_at: "2026-02-04T10:15:00.000000+00:00"
  },
  {
    file: "/home/sdp/jyz/torch-xpu-ops/src/ATen/native/xpu/sycl/ActivationKernels.cpp",
    line: 89,
    code: "result[idx] = input[idx] * scale;",
    severity: "low",
    category: "logic",
    reason: "Missing boundary check for idx before array access.",
    suggestion: "Add bounds checking: if (idx < input.numel()) { result[idx] = input[idx] * scale; }",
    cuda_validated: false,
    cuda_has_same_issue: null,
    adjusted_severity: null,
    validation_reason: "",
    op_name: "relu",
    cuda_file: null,
    cuda_function: null,
    scanned_at: "2026-02-05T08:00:00.000000+00:00"
  }
];

export async function fetchRepoFixes(): Promise<RepoFixIssue[]> {
  const apiUrl = 'http://127.0.0.1:8000/get_scan_results';

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch repo fixes');
    }

    return response.json();
  } catch (error) {
    console.warn('API call failed, using mock data:', error);
    return MOCK_REPO_FIXES;
  }
}

export interface XPUSyncIssue {
  file: string;
  line: number;
  code: string;
  severity: string;
  category: string;
  reason: string;
  suggestion: string;
  cuda_validated: boolean;
  cuda_has_same_issue: boolean | null;
  adjusted_severity: string | null;
  validation_reason: string;
  op_name: string | null;
  cuda_file: string | null;
  cuda_function: string | null;
  scanned_at: string;
}

const MOCK_XPU_SYNC: XPUSyncIssue[] = [
  {
    file: "/home/sdp/jyz/torch-xpu-ops/src/ATen/native/xpu/sycl/BatchNormKernels.cpp",
    line: 65,
    code: "(self.is_contiguous() && self.strides()[1] == 1)",
    severity: "critical",
    category: "ptr-calc",
    reason: "Out-of-bounds stride access: self.strides()[1] can crash on 0D, 1D, or 2D tensors.",
    suggestion: "Add a dimension guard before accessing strides: (self.ndimension() >= 2)",
    cuda_validated: false,
    cuda_has_same_issue: null,
    adjusted_severity: null,
    validation_reason: "",
    op_name: null,
    cuda_file: null,
    cuda_function: null,
    scanned_at: "2026-02-03T07:12:25.082268+00:00"
  },
  {
    file: "/home/sdp/jyz/torch-xpu-ops/src/ATen/native/xpu/sycl/IndexKernels.cpp",
    line: 120,
    code: "auto ptr = data + offset;",
    severity: "high",
    category: "ptr-calc",
    reason: "Potential pointer overflow in offset calculation.",
    suggestion: "Use safe_math or check offset limits.",
    cuda_validated: true,
    cuda_has_same_issue: false,
    adjusted_severity: "medium",
    validation_reason: "CUDA handles this with specific guard bands.",
    op_name: "index_select",
    cuda_file: "IndexKernels.cu",
    cuda_function: "index_select_kernel",
    scanned_at: "2026-02-04T09:30:00.000000+00:00"
  },
  {
    file: "/home/sdp/jyz/torch-xpu-ops/src/ATen/native/xpu/sycl/MemoryKernels.cpp",
    line: 78,
    code: "memcpy(dst_ptr, src_ptr, size * sizeof(float));",
    severity: "medium",
    category: "ptr-calc",
    reason: "Potential buffer overflow if size is not validated against allocation size.",
    suggestion: "Add size validation: assert(size <= allocated_size) before memcpy.",
    cuda_validated: true,
    cuda_has_same_issue: false,
    adjusted_severity: "low",
    validation_reason: "CUDA version includes size validation in the calling function.",
    op_name: "copy_",
    cuda_file: "MemoryKernels.cu",
    cuda_function: "copy_kernel",
    scanned_at: "2026-02-04T11:45:00.000000+00:00"
  },
  {
    file: "/home/sdp/jyz/torch-xpu-ops/src/ATen/native/xpu/sycl/ReduceKernels.cpp",
    line: 156,
    code: "output[out_idx] = partial_sum[thread_id];",
    severity: "high",
    category: "ptr-calc",
    reason: "Race condition in reduction phase without proper synchronization.",
    suggestion: "Add barrier synchronization: item.barrier(sycl::access::fence_space::local_space) before write.",
    cuda_validated: true,
    cuda_has_same_issue: false,
    adjusted_severity: "high",
    validation_reason: "CUDA uses __syncthreads() for proper synchronization.",
    op_name: "sum",
    cuda_file: "ReduceKernels.cu",
    cuda_function: "reduce_sum_kernel",
    scanned_at: "2026-02-05T06:20:00.000000+00:00"
  }
];

export async function fetchXPUSync(): Promise<XPUSyncIssue[]> {
  const apiUrl = 'http://127.0.0.1:8000/get_ptr_scan';

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch XPU sync issues');
    }

    return response.json();
  } catch (error) {
    console.warn('API call failed, using mock data:', error);
    return MOCK_XPU_SYNC;
  }
}
