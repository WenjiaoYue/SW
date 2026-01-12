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

export async function fetchTritonOps(): Promise<TritonOpsResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ops: MOCK_TRITON_OPS
      });
    }, 500);
  });
}
