export type ModelCapability = 
  | "chat" | "reasoning" | "coding" | "vision" | "embedding" | "reranking"
  | "safety" | "pii" | "asr" | "tts" | "image-generation" | "image-editing"
  | "video-understanding" | "video-generation" | "detection" | "specialized";

export type ModelTransport = 
  | "openai-chat" | "openai-embedding" | "rerank-http" | "openai-image" 
  | "http" | "websocket" | "grpc";

export type ModelDeployment = "hosted" | "self-hosted";

export type ModelInputType = "text" | "image" | "audio" | "video" | "document" | "specialized";
export type ModelOutputType = "text" | "json" | "vector" | "image" | "audio" | "video" | "specialized";

export type ModelRegistryItem = {
  id: string;
  displayName: string;
  provider: string;
  capabilities: ModelCapability[];
  transport: ModelTransport;
  deployment: ModelDeployment[];
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsStructuredOutput: boolean;
  acceptedInputs: ModelInputType[];
  outputType: ModelOutputType;
  apiBaseEnv: string;
  apiKeyEnv?: string;
  description?: string;
  fullName?: string;
  enabled: boolean;
};

export const modelRegistry: ModelRegistryItem[] = [
  {
    "id": "black-forest-labs/FLUX.1-schnell",
    "displayName": "Black Forest Labs",
    "fullName": "FLUX.1 Schnell",
    "provider": "blackforestlabs",
    "capabilities": ["image-generation"],
    "transport": "openai-image",
    "deployment": ["hosted"],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": ["text"],
    "outputType": "image",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "FLUX.1-schnell is a 12 billion parameter flow-matching model for fast image generation."
  },
  {
    "id": "stabilityai/stable-diffusion-3-medium",
    "displayName": "Stability AI",
    "fullName": "Stable Diffusion 3 Medium",
    "provider": "stabilityai",
    "capabilities": ["image-generation"],
    "transport": "openai-image",
    "deployment": ["hosted"],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": ["text"],
    "outputType": "image",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "SD3 Medium is a Multimodal Diffusion Transformer (MMDiT) text-to-image model."
  },
  {
    "id": "stabilityai/sdxl",
    "displayName": "Stability AI",
    "fullName": "Stable Diffusion XL",
    "provider": "stabilityai",
    "capabilities": ["image-generation"],
    "transport": "openai-image",
    "deployment": ["hosted"],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": ["text"],
    "outputType": "image",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "SDXL is a latent diffusion model for text-to-image synthesis."
  },
  {
    "id": "minimaxai/minimax-m3",
    "displayName": "Minimaxai",
    "provider": "minimaxai",
    "capabilities": [
      "chat",
      "coding",
      "vision"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "MiniMax M3 Preview is a multimodal MoE vision-language model with strong reasoning, coding, and tool-calling capabilities.",
    "fullName": "MiniMax M3 Preview"
  },
  {
    "id": "google/diffusiongemma-26b-a4b-it",
    "displayName": "Google",
    "provider": "google",
    "capabilities": [
      "chat"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Diffusion-based 26B parameter LLM enabling parallel token generation for real-time text apps",
    "fullName": "DiffusionGemma 26B A4B IT"
  },
  {
    "id": "nvidia/nemotron-3-ultra-550b-a55b",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "chat",
      "reasoning",
      "coding"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Open, efficient hybrid Mamba-Transformer MoE with 1M context, excelling in agentic reasoning, coding, planning, tool calling, and more",
    "fullName": "Nemotron 3 Ultra 550B A55B"
  },
  {
    "id": "nvidia/nemotron-3.5-content-safety",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "safety"
    ],
    "transport": "http",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Multilingual, multimodal model for detecting unsafe and toxic content.",
    "fullName": "Nemotron 3.5 Content Safety"
  },
  {
    "id": "nvidia/cosmos3-nano",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "video-generation"
    ],
    "transport": "http",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "video",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Generates physics-aware videos from text prompts or an image prompt for physical AI development.",
    "fullName": "Cosmos3 Nano"
  },
  {
    "id": "nvidia/cosmos3-nano-reasoner",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "video-understanding"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": false,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "video"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Vision language model that excels in understanding the physical world using structured reasoning on videos or images.",
    "fullName": "Cosmos3 Nano Reasoner"
  },
  {
    "id": "stepfun-ai/step-3.7-flash",
    "displayName": "Stepfun-ai",
    "provider": "stepfun-ai",
    "capabilities": [
      "chat",
      "coding",
      "vision"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "A sparse MoE multimodal reasoning model good for enterprise, agentic and coding tasks.",
    "fullName": "Step 3.7 Flash"
  },
  {
    "id": "moonshotai/kimi-k2.6",
    "displayName": "Moonshotai",
    "provider": "moonshotai",
    "capabilities": [
      "chat",
      "vision",
      "video-understanding"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image",
      "video"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "1T multimodal MoE for long-horizon coding, agentic tool use, and image/video understanding.",
    "fullName": "Kimi K2.6"
  },
  {
    "id": "mistralai/mistral-medium-3.5-128b",
    "displayName": "Mistral AI",
    "provider": "mistralai",
    "capabilities": [
      "chat",
      "coding"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "A high performing model for text generation, coding and agentic use cases",
    "fullName": "Mistral Medium 3.5 128B"
  },
  {
    "id": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "vision",
      "asr",
      "video-understanding"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": false,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image",
      "audio",
      "video"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Nemotron 3 Nano Omni is an omni-modal reasoning model that understands images, video, speech, text.",
    "fullName": "Nemotron 3 Nano Omni 30B A3B Reasoning"
  },
  {
    "id": "deepseek-ai/deepseek-v4-flash",
    "displayName": "DeepSeek AI",
    "provider": "deepseek-ai",
    "capabilities": [
      "chat",
      "coding"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "DeepSeek V4 Flash is a 284B MoE model with 1M-token context optimized for fast coding and agents.",
    "fullName": "DeepSeek V4 Flash"
  },
  {
    "id": "deepseek-ai/deepseek-v4-pro",
    "displayName": "DeepSeek AI",
    "provider": "deepseek-ai",
    "capabilities": [
      "chat",
      "coding"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "DeepSeek V4 scales to 1M-token context windows with efficient MoE architecture for coding tasks.",
    "fullName": "DeepSeek V4 Pro"
  },
  {
    "id": "z-ai/glm-5.1",
    "displayName": "Z.ai",
    "provider": "z-ai",
    "capabilities": [
      "chat",
      "reasoning"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "GLM-5.1 is a flagship LLM for agentic workflows, coding, and long-horizon reasoning tasks.",
    "fullName": "GLM 5.1"
  },
  {
    "id": "nvidia/nemotron-3-content-safety",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "safety"
    ],
    "transport": "http",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Multilingual, multimodal model for detecting unsafe and toxic content.",
    "fullName": "Nemotron 3 Content Safety"
  },
  {
    "id": "nvidia/synthetic-video-detector",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "detection"
    ],
    "transport": "grpc",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text",
      "video"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "NVIDIA Synthetic Video Detector is an AI-powered micro-service for detecting AI-generated (synthetic) videos.",
    "fullName": "Synthetic Video Detector"
  },
  {
    "id": "nvidia/Active Speaker Detection",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "detection"
    ],
    "transport": "grpc",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text",
      "video"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Detect and track speaker identities across video frames.",
    "fullName": "Active Speaker Detection"
  },
  {
    "id": "nvidia/ising-calibration-1-35b-a3b",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "specialized"
    ],
    "transport": "http",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text",
      "specialized"
    ],
    "outputType": "specialized",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Open VLM for quantum computer calibration chart understanding across a range of qubit modalities.",
    "fullName": "Ising Calibration 1 35B A3B"
  },
  {
    "id": "minimaxai/minimax-m2.7",
    "displayName": "Minimaxai",
    "provider": "minimaxai",
    "capabilities": [
      "chat",
      "reasoning"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "MiniMax M2.7 is a 230B-parameter text-to-text AI model excelling in coding, reasoning, and office tasks.",
    "fullName": "MiniMax M2.7"
  },
  {
    "id": "google/gemma-4-31b-it",
    "displayName": "Google",
    "provider": "google",
    "capabilities": [
      "chat",
      "reasoning"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Dense 31B model delivering frontier reasoning for coding, agentic workflows, and fine-tuning.",
    "fullName": "Gemma 4 31B IT"
  },
  {
    "id": "mistralai/mistral-small-4-119b-2603",
    "displayName": "Mistral AI",
    "provider": "mistralai",
    "capabilities": [
      "chat",
      "coding",
      "vision"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Hybrid MoE model unifying instruct, reasoning, and coding with multimodal input and 256k context",
    "fullName": "Mistral Small 4 119B 2603"
  },
  {
    "id": "nvidia/nemotron-voicechat",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "chat",
      "asr",
      "tts"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "audio"
    ],
    "outputType": "audio",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Nemotron 3 Voicechat",
    "fullName": "Nemotron Voicechat"
  },
  {
    "id": "nvidia/nemotron-3-super-120b-a12b",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "chat",
      "reasoning"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Open, efficient hybrid Mamba-Transformer MoE with 1M context, excelling in agentic reasoning, coding, planning, tool calling, and more",
    "fullName": "Nemotron 3 Super 120B A12B"
  },
  {
    "id": "qwen/qwen3.5-122b-a10b",
    "displayName": "Qwen",
    "provider": "qwen",
    "capabilities": [
      "chat",
      "vision"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "122B MoE LLM (10B active) for coding, reasoning, multimodal chat. Agent-ready.",
    "fullName": "Qwen 3.5 122B A10B"
  },
  {
    "id": "nvidia/gliner-pii",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "pii"
    ],
    "transport": "http",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "GLiNER PII detects Personally Identifiable Information in text.",
    "fullName": "GLiNER PII"
  },
  {
    "id": "nvidia/cosmos-transfer2.5-2b",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "video-generation"
    ],
    "transport": "http",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "video",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Generates physics-aware video world states for physical AI development using text prompts and multiple spatial control inputs derived from real-world data or simulation.",
    "fullName": "Cosmos Transfer 2.5 2B"
  },
  {
    "id": "qwen/qwen3.5-397b-a17b",
    "displayName": "Qwen",
    "provider": "qwen",
    "capabilities": [
      "chat",
      "vision"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Next-gen Qwen 3.5 VLM (400B MoE) brings advanced vision, chat, RAG, and agentic capabilities.",
    "fullName": "Qwen 3.5 397B A17B"
  },
  {
    "id": "stepfun-ai/step-3.5-flash",
    "displayName": "Stepfun-ai",
    "provider": "stepfun-ai",
    "capabilities": [
      "chat",
      "reasoning"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "200B open-source reasoning engine with sparse MoE powering frontier agentic AI.",
    "fullName": "Step 3.5 Flash"
  },
  {
    "id": "nvidia/nemotron-content-safety-reasoning-4b",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "safety"
    ],
    "transport": "http",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "A context-aware safety model that applies reasoning to enforce domain-specific policies.",
    "fullName": "Nemotron Content Safety Reasoning 4B"
  },
  {
    "id": "nvidia/nemotron-3-nano-30b-a3b",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "chat",
      "coding"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Open, efficient MoE model with 1M context, excelling in coding, reasoning, instruction following, tool calling, and more",
    "fullName": "Nemotron 3 Nano 30B A3B"
  },
  {
    "id": "nvidia/riva-translate-4b-instruct-v1_1",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "chat"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Translation model in 12 languages with few-shots example prompts capability.",
    "fullName": "Riva Translate 4B Instruct v1.1"
  },
  {
    "id": "mistralai/mistral-large-3-675b-instruct-2512",
    "displayName": "Mistral AI",
    "provider": "mistralai",
    "capabilities": [
      "chat",
      "vision"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "A state-of-the-art general purpose MoE VLM ideal for chat, agentic and instruction based use cases.",
    "fullName": "Mistral Large 3 675B Instruct 2512"
  },
  {
    "id": "mistralai/ministral-14b-instruct-2512",
    "displayName": "Mistral AI",
    "provider": "mistralai",
    "capabilities": [
      "chat",
      "vision"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "A general purpose VLM ideal for chat and instruction based use cases",
    "fullName": "Ministral 14B Instruct 2512"
  },
  {
    "id": "nvidia/streampetr",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "specialized"
    ],
    "transport": "http",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text",
      "specialized"
    ],
    "outputType": "specialized",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "StreamPETR offers efficient 3D object detection for autonomous driving by propagating sparse object queries temporally.",
    "fullName": "StreamPETR"
  },
  {
    "id": "nvidia/nemotron-nano-12b-v2-vl",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "vision",
      "video-understanding"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": false,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image",
      "video"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Nemotron Nano 12B v2 VL enables multi-image and video understanding, along with visual Q&A and summarization capabilities.",
    "fullName": "Nemotron Nano 12B v2 VL"
  },
  {
    "id": "nvidia/llama-3.1-nemotron-safety-guard-8b-v3",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "safety"
    ],
    "transport": "http",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Leading multilingual content safety model for enhancing the safety and moderation capabilities of LLMs",
    "fullName": "Llama 3.1 Nemotron Safety Guard 8B v3"
  },
  {
    "id": "stockmark/stockmark-2-100b-instruct",
    "displayName": "Stockmark",
    "provider": "Stockmark",
    "capabilities": [
      "chat"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Japanese-specialized large-language-model for enterprises to read and understand complex business documents.",
    "fullName": "Stockmark 2 100B Instruct"
  },
  {
    "id": "qwen/qwen3-next-80b-a3b-instruct",
    "displayName": "Qwen",
    "provider": "qwen",
    "capabilities": [
      "chat"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Qwen3-Next Instruct blends hybrid attention, sparse MoE, and stability boosts for ultra-long context AI.",
    "fullName": "Qwen3-Next 80B A3B Instruct"
  },
  {
    "id": "bytedance/seed-oss-36b-instruct",
    "displayName": "ByteDance",
    "provider": "bytedance",
    "capabilities": [
      "chat",
      "reasoning"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "ByteDance open-source LLM with long-context, reasoning, and agentic intelligence.",
    "fullName": "Seed-OSS 36B Instruct"
  },
  {
    "id": "nvidia/nvidia-nemotron-nano-9b-v2",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "chat",
      "reasoning"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "High-efficiency LLM with hybrid Transformer-Mamba design, excelling in reasoning and agentic tasks.",
    "fullName": "Nemotron Nano 9B v2"
  },
  {
    "id": "openai/gpt-oss-20b",
    "displayName": "OpenAI",
    "provider": "openai",
    "capabilities": [
      "chat",
      "reasoning"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Smaller Mixture of Experts (MoE) text-only LLM for efficient AI reasoning and math",
    "fullName": "GPT-OSS 20B"
  },
  {
    "id": "openai/gpt-oss-120b",
    "displayName": "OpenAI",
    "provider": "openai",
    "capabilities": [
      "chat",
      "reasoning"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Mixture of Experts (MoE) reasoning LLM (text-only) designed to fit within 80GB GPU.",
    "fullName": "GPT-OSS 120B"
  },
  {
    "id": "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "chat",
      "reasoning"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "High efficiency model with leading accuracy for reasoning, tool calling, chat, and instruction following.",
    "fullName": "Llama 3.3 Nemotron Super 49B v1.5"
  },
  {
    "id": "sarvamai/sarvam-m",
    "displayName": "Sarvamai",
    "provider": "Sarvamai",
    "capabilities": [
      "chat",
      "coding"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Multilingual, hybrid-reasoning model optimized for Indian language tasks, programming, mathematical reasoning capabilities.",
    "fullName": "Sarvam-M"
  },
  {
    "id": "meta/llama-guard-4-12b",
    "displayName": "Meta",
    "provider": "meta",
    "capabilities": [
      "safety"
    ],
    "transport": "http",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Multi-modal model to classify safety for input prompts as well output responses.",
    "fullName": "Llama Guard 4 12B"
  },
  {
    "id": "google/gemma-3n-e4b-it",
    "displayName": "Google",
    "provider": "google",
    "capabilities": [
      "chat",
      "vision",
      "asr"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image",
      "audio"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "An edge computing AI model which accepts text, audio and image input, ideal for resource-constrained environments",
    "fullName": "Gemma 3n E4B IT"
  },
  {
    "id": "google/gemma-3n-e2b-it",
    "displayName": "Google",
    "provider": "google",
    "capabilities": [
      "chat",
      "vision",
      "asr"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image",
      "audio"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "An edge computing AI model which accepts text, audio and image input, ideal for resource-constrained environments",
    "fullName": "Gemma 3n E2B IT"
  },
  {
    "id": "nvidia/cosmos-transfer1-7b",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "video-generation"
    ],
    "transport": "http",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "video",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Generates physics-aware video world states for physical AI development using text prompts and multiple spatial control inputs derived from real-world data or simulation.",
    "fullName": "Cosmos Transfer1 7B"
  },
  {
    "id": "nvidia/Background Noise Removal",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "asr"
    ],
    "transport": "grpc",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text",
      "audio"
    ],
    "outputType": "audio",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Removes unwanted noises from audio improving speech intelligibility.",
    "fullName": "Background Noise Removal"
  },
  {
    "id": "mistralai/mistral-nemotron",
    "displayName": "Mistral AI",
    "provider": "mistralai",
    "capabilities": [
      "chat"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Built for agentic workflows, this model excels in coding, instruction following, and function calling",
    "fullName": "Mistral Nemotron"
  },
  {
    "id": "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "vision"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": false,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Multi-modal vision-language model that understands text/img and creates informative responses",
    "fullName": "Llama 3.1 Nemotron Nano VL 8B v1"
  },
  {
    "id": "nvidia/magpie-tts-zeroshot",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "tts"
    ],
    "transport": "grpc",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "audio",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Expressive and engaging text-to-speech, generated from a short audio sample.",
    "fullName": "Magpie TTS Zero-Shot"
  },
  {
    "id": "meta/llama-4-maverick-17b-128e-instruct",
    "displayName": "Meta",
    "provider": "meta",
    "capabilities": [
      "chat",
      "vision"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "A general purpose multimodal, multilingual 128 MoE model with 17B parameters.",
    "fullName": "Llama 4 Maverick 17B 128E Instruct"
  },
  {
    "id": "nvidia/sparsedrive",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "specialized"
    ],
    "transport": "http",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text",
      "specialized"
    ],
    "outputType": "specialized",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "End-to-end autonomous driving stack integrating perception, prediction, and planning with sparse scene representations for efficiency and safety.",
    "fullName": "SparseDrive"
  },
  {
    "id": "nvidia/bevformer",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "specialized"
    ],
    "transport": "http",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text",
      "specialized"
    ],
    "outputType": "specialized",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Advanced transformer for multi-frame bird's-eye-view 3D perception in autonomous driving.",
    "fullName": "BEVFormer"
  },
  {
    "id": "nvidia/llama-3.3-nemotron-super-49b-v1",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "chat",
      "reasoning"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "High efficiency model with leading accuracy for reasoning, tool calling, chat, and instruction following.",
    "fullName": "Llama 3.3 Nemotron Super 49B v1"
  },
  {
    "id": "nvidia/llama-3.1-nemotron-nano-8b-v1",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "chat",
      "reasoning"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Leading reasoning and agentic AI accuracy model for PC and edge.",
    "fullName": "Llama 3.1 Nemotron Nano 8B v1"
  },
  {
    "id": "nvidia/nv-embedcode-7b-v1",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "embedding"
    ],
    "transport": "openai-embedding",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "vector",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "The NV-EmbedCode model is a 7B Mistral-based embedding model optimized for code retrieval, supporting text, code, and hybrid queries.",
    "fullName": "NV-EmbedCode 7B v1"
  },
  {
    "id": "microsoft/phi-4-mini-instruct",
    "displayName": "Microsoft",
    "provider": "microsoft",
    "capabilities": [
      "chat"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Lightweight multilingual LLM powering AI applications in latency bound, memory/compute constrained environments",
    "fullName": "Phi-4 Mini Instruct"
  },
  {
    "id": "microsoft/phi-4-multimodal-instruct",
    "displayName": "Microsoft",
    "provider": "microsoft",
    "capabilities": [
      "vision",
      "asr"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": false,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image",
      "audio"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Cutting-edge open multimodal model exceling in high-quality reasoning from image and audio inputs.",
    "fullName": "Phi-4 Multimodal Instruct"
  },
  {
    "id": "meta/llama-3.3-70b-instruct",
    "displayName": "Meta",
    "provider": "meta",
    "capabilities": [
      "chat",
      "reasoning"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Advanced LLM for reasoning, math, general knowledge, and function calling",
    "fullName": "Llama 3.3 70B Instruct"
  },
  {
    "id": "nvidia/Studio Voice",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "asr"
    ],
    "transport": "grpc",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text",
      "audio"
    ],
    "outputType": "audio",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Enhance input speech recorded with low-quality microphones in noisy or reverberant environments, producing studio-quality speech.",
    "fullName": "Studio Voice"
  },
  {
    "id": "meta/llama-3.2-3b-instruct",
    "displayName": "Meta",
    "provider": "meta",
    "capabilities": [
      "chat"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Advanced state-of-the-art small language model with language understanding, superior reasoning, and text generation.",
    "fullName": "Llama 3.2 3B Instruct"
  },
  {
    "id": "meta/llama-3.2-11b-vision-instruct",
    "displayName": "Meta",
    "provider": "meta",
    "capabilities": [
      "vision"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": false,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Cutting-edge vision-language model exceling in high-quality reasoning from images.",
    "fullName": "Llama 3.2 11B Vision Instruct"
  },
  {
    "id": "meta/llama-3.2-90b-vision-instruct",
    "displayName": "Meta",
    "provider": "meta",
    "capabilities": [
      "vision"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": false,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Cutting-edge vision-Language model exceling in high-quality reasoning from images.",
    "fullName": "Llama 3.2 90B Vision Instruct"
  },
  {
    "id": "meta/llama-3.2-1b-instruct",
    "displayName": "Meta",
    "provider": "meta",
    "capabilities": [
      "chat",
      "coding"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Advanced state-of-the-art small language model with language understanding, superior reasoning, and text generation.",
    "fullName": "Llama 3.2 1B Instruct"
  },
  {
    "id": "abacusai/dracarys-llama-3.1-70b-instruct",
    "displayName": "Abacus.AI",
    "provider": "Abacus.AI",
    "capabilities": [
      "chat",
      "coding"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Fine-tuned Llama 3.1 70B model for code generation, summarization, and multi-language tasks.",
    "fullName": "Dracarys Llama 3.1 70B Instruct"
  },
  {
    "id": "meta/esm2-650m",
    "displayName": "Meta",
    "provider": "meta",
    "capabilities": [
      "specialized"
    ],
    "transport": "http",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text",
      "specialized"
    ],
    "outputType": "specialized",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Generates embeddings of proteins from their amino acid sequences.",
    "fullName": "ESM2 650M"
  },
  {
    "id": "nvidia/nemotron-mini-4b-instruct",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "chat"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Optimized SLM for on-device inference and fine-tuned for roleplay, RAG and function calling",
    "fullName": "Nemotron Mini 4B Instruct"
  },
  {
    "id": "google/gemma-2-2b-it",
    "displayName": "Google",
    "provider": "google",
    "capabilities": [
      "chat"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Advanced small language generative AI model for edge applications",
    "fullName": "Gemma 2 2B IT"
  },
  {
    "id": "meta/llama-3.1-70b-instruct",
    "displayName": "Meta",
    "provider": "meta",
    "capabilities": [
      "chat"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Powers complex conversations with superior contextual understanding, reasoning and text generation.",
    "fullName": "Llama 3.1 70B Instruct"
  },
  {
    "id": "meta/llama-3.1-8b-instruct",
    "displayName": "Meta",
    "provider": "meta",
    "capabilities": [
      "chat"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Advanced state-of-the-art model with language understanding, superior reasoning, and text generation.",
    "fullName": "Llama 3.1 8B Instruct"
  },
  {
    "id": "nvidia/nv-embed-v1",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "embedding"
    ],
    "transport": "openai-embedding",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "vector",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Generates high-quality numerical embeddings from text inputs.",
    "fullName": "NV-Embed v1"
  },
  {
    "id": "upstage/solar-10.7b-instruct",
    "displayName": "Upstage",
    "provider": "upstage",
    "capabilities": [
      "chat"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Excels in NLP tasks, particularly in instruction-following, reasoning, and mathematics.",
    "fullName": "Solar 10.7B Instruct"
  },
  {
    "id": "google/paligemma",
    "displayName": "Google",
    "provider": "google",
    "capabilities": [
      "vision"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": false,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text",
      "image"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Vision language model adept at comprehending text and visual inputs to produce informative responses",
    "fullName": "PaLiGemma"
  },
  {
    "id": "nvidia/rerank-qa-mistral-4b",
    "displayName": "NVIDIA",
    "provider": "nvidia",
    "capabilities": [
      "reranking"
    ],
    "transport": "rerank-http",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "GPU-accelerated model optimized for providing a probability score that a given passage contains the information to answer a question.",
    "fullName": "Rerank QA Mistral 4B"
  },
  {
    "id": "meta/esmfold",
    "displayName": "Meta",
    "provider": "meta",
    "capabilities": [
      "specialized"
    ],
    "transport": "http",
    "deployment": [
      "hosted"
    ],
    "supportsStreaming": false,
    "supportsTools": false,
    "supportsStructuredOutput": false,
    "acceptedInputs": [
      "text",
      "specialized"
    ],
    "outputType": "specialized",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "Predicts the 3D structure of a protein from its amino acid sequence.",
    "fullName": "ESMFold"
  },
  {
    "id": "mistralai/mixtral-8x7b-instruct-v0.1",
    "displayName": "Mistral AI",
    "provider": "mistralai",
    "capabilities": [
      "chat",
      "reasoning"
    ],
    "transport": "openai-chat",
    "deployment": [
      "hosted",
      "self-hosted"
    ],
    "supportsStreaming": true,
    "supportsTools": true,
    "supportsStructuredOutput": true,
    "acceptedInputs": [
      "text"
    ],
    "outputType": "text",
    "apiBaseEnv": "NVIDIA_API_BASE_URL",
    "apiKeyEnv": "NVIDIA_API_KEY",
    "enabled": true,
    "description": "An MOE LLM that follows instructions, completes requests, and generates creative text.",
    "fullName": "Mixtral 8x7B Instruct v0.1"
  }
];

export const getModelsByCapability = (capability: ModelCapability) => {
  return modelRegistry.filter(m => m.capabilities.includes(capability) && m.enabled);
};

export const getModelById = (id: string) => {
  return modelRegistry.find(m => m.id === id);
};
