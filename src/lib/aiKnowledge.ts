// NEXUS AI — Comprehensive AI Technology Knowledge Base
// All terms organized by category for the Knowledge panel

export interface AITerm {
  acronym: string;
  fullForm: string;
  description: string;
}

export interface AICategory {
  id: string;
  name: string;
  icon: string;
  terms: AITerm[];
}

export const AI_KNOWLEDGE_CATEGORIES: AICategory[] = [
  {
    id: 'model-architectures',
    name: 'Model Architectures',
    icon: 'Brain',
    terms: [
      { acronym: 'SLM', fullForm: 'Small Language Model', description: 'A compact language model with fewer parameters, designed for efficient inference on edge devices or resource-constrained environments.' },
      { acronym: 'MoE', fullForm: 'Mixture of Experts', description: 'An architecture that routes inputs to specialized sub-networks (experts), activating only a subset per token for efficient scaling.' },
      { acronym: 'GAN', fullForm: 'Generative Adversarial Network', description: 'A framework with a generator and discriminator trained in opposition to produce realistic synthetic data.' },
      { acronym: 'VAE', fullForm: 'Variational Autoencoder', description: 'A probabilistic generative model that learns a latent representation by encoding and decoding data with regularization.' },
      { acronym: 'CNN', fullForm: 'Convolutional Neural Network', description: 'A network architecture using convolutional layers to detect spatial patterns, widely used for image processing.' },
      { acronym: 'RNN', fullForm: 'Recurrent Neural Network', description: 'A network that processes sequential data by maintaining a hidden state across time steps.' },
      { acronym: 'LSTM', fullForm: 'Long Short-Term Memory', description: 'A specialized RNN with gating mechanisms that mitigates vanishing gradients and captures long-range dependencies.' },
      { acronym: 'GRU', fullForm: 'Gated Recurrent Unit', description: 'A simplified LSTM variant with fewer gates, offering comparable performance with lower computational cost.' },
      { acronym: 'MLP', fullForm: 'Multilayer Perceptron', description: 'A feedforward network with multiple layers of neurons using nonlinear activation functions.' },
      { acronym: 'SSM', fullForm: 'State Space Model', description: 'A model based on state space equations that processes sequences with linear recurrences, enabling efficient long-context modeling.' },
      { acronym: 'DBN', fullForm: 'Deep Belief Network', description: 'A generative graphical model composed of stacked restricted Boltzmann machines trained layer by layer.' },
      { acronym: 'RBM', fullForm: 'Restricted Boltzmann Machine', description: 'A two-layer stochastic neural network that learns probability distributions over inputs without intra-layer connections.' },
      { acronym: 'SVM', fullForm: 'Support Vector Machine', description: 'A supervised classifier that finds the maximum-margin hyperplane separating data classes.' },
      { acronym: 'GNN', fullForm: 'Graph Neural Network', description: 'A network that operates on graph-structured data by passing messages between nodes along edges.' },
    ],
  },
  {
    id: 'language-ai',
    name: 'Language AI',
    icon: 'MessageSquare',
    terms: [
      { acronym: 'NLU', fullForm: 'Natural Language Understanding', description: 'The subfield of NLP focused on comprehension — extracting meaning, intent, and entities from text.' },
      { acronym: 'NLG', fullForm: 'Natural Language Generation', description: 'The subfield of NLP focused on producing fluent, coherent natural language text from structured data or models.' },
      { acronym: 'GenAI', fullForm: 'Generative Artificial Intelligence', description: 'AI systems that create new content — text, images, audio, or code — by learning patterns from training data.' },
      { acronym: 'XAI', fullForm: 'Explainable Artificial Intelligence', description: 'Techniques that make model decisions transparent and interpretable to humans for trust and accountability.' },
      { acronym: 'CAI', fullForm: 'Constitutional Artificial Intelligence', description: 'A training approach where AI self-corrects its outputs against a set of principles to improve safety and alignment.' },
    ],
  },
  {
    id: 'alignment-training',
    name: 'Alignment & Training',
    icon: 'ShieldCheck',
    terms: [
      { acronym: 'RLHF', fullForm: 'Reinforcement Learning from Human Feedback', description: 'A technique that fine-tunes models using human preference rankings to align outputs with desired behavior.' },
      { acronym: 'RLAIF', fullForm: 'Reinforcement Learning from AI Feedback', description: 'A variant of RLHF that uses AI-generated preferences instead of human annotations for scalable alignment.' },
      { acronym: 'DPO', fullForm: 'Direct Preference Optimization', description: 'A method that optimizes models directly on preference data without an explicit reward model, simplifying alignment.' },
      { acronym: 'KTO', fullForm: 'Kahneman-Tversky Optimization', description: 'An alignment approach based on prospect theory from behavioral economics, optimizing for human utility judgments.' },
      { acronym: 'SFT', fullForm: 'Supervised Fine-Tuning', description: 'Training a pre-trained model on labeled examples to adapt it to a specific task or domain.' },
      { acronym: 'PEFT', fullForm: 'Parameter-Efficient Fine-Tuning', description: 'Methods that fine-tune a small subset of parameters while freezing the rest, reducing memory and compute costs.' },
      { acronym: 'LoRA', fullForm: 'Low-Rank Adaptation', description: 'A PEFT technique that adds low-rank decomposition matrices to frozen weights, enabling efficient fine-tuning.' },
      { acronym: 'QLoRA', fullForm: 'Quantized Low-Rank Adaptation', description: 'Combines 4-bit quantization with LoRA adapters to fine-tune large models on consumer-grade hardware.' },
      { acronym: 'PPO', fullForm: 'Proximal Policy Optimization', description: 'A policy gradient method that clips updates to prevent destructive large changes during reinforcement learning.' },
      { acronym: 'GRPO', fullForm: 'Group Relative Policy Optimization', description: 'A variant of PPO that estimates baselines from group statistics, reducing variance without a separate critic model.' },
    ],
  },
  {
    id: 'reasoning',
    name: 'Reasoning & Retrieval',
    icon: 'Lightbulb',
    terms: [
      { acronym: 'CoT', fullForm: 'Chain of Thought', description: 'A prompting technique where the model generates step-by-step reasoning before producing a final answer.' },
      { acronym: 'ToT', fullForm: 'Tree of Thoughts', description: 'Extends CoT by exploring multiple reasoning branches in a tree structure and selecting the most promising path.' },
      { acronym: 'GoT', fullForm: 'Graph of Thoughts', description: 'Generalizes CoT and ToT by representing reasoning as a graph, allowing non-linear idea combination and reuse.' },
      { acronym: 'RAG', fullForm: 'Retrieval-Augmented Generation', description: 'A technique that retrieves relevant documents from an external store and provides them as context to the model.' },
      { acronym: 'CAG', fullForm: 'Cache-Augmented Generation', description: 'A method that pre-computes and caches knowledge representations to reduce retrieval latency at inference time.' },
      { acronym: 'IR', fullForm: 'Information Retrieval', description: 'The process of finding relevant documents or data from a large corpus in response to a query.' },
      { acronym: 'KAG', fullForm: 'Knowledge-Augmented Generation', description: 'Enhances generation by injecting structured knowledge from knowledge graphs or curated sources into the prompt.' },
      { acronym: 'KG', fullForm: 'Knowledge Graph', description: 'A structured representation of entities and their relationships, enabling semantic queries and reasoning.' },
      { acronym: 'ANN', fullForm: 'Approximate Nearest Neighbor', description: 'Algorithms that efficiently find vectors close to a query vector in high-dimensional space, trading exactness for speed.' },
      { acronym: 'HNSW', fullForm: 'Hierarchical Navigable Small World', description: 'A graph-based ANN index that builds a multi-layered proximity graph for fast approximate similarity search.' },
      { acronym: 'BM25', fullForm: 'Best Matching 25 (Sparse Retrieval)', description: 'A ranking function that scores document relevance using term frequency and inverse document frequency with length normalization.' },
      { acronym: 'TF-IDF', fullForm: 'Term Frequency-Inverse Document Frequency', description: 'A numerical statistic reflecting how important a word is to a document within a corpus, used in text retrieval.' },
      { acronym: 'Vector DB', fullForm: 'Vector Database', description: 'A database optimized for storing and querying high-dimensional vectors, enabling semantic similarity search at scale.' },
    ],
  },
  {
    id: 'hardware-precision',
    name: 'Hardware & Precision',
    icon: 'Cpu',
    terms: [
      { acronym: 'GPU', fullForm: 'Graphics Processing Unit', description: 'A massively parallel processor originally for rendering, now the dominant accelerator for deep learning training and inference.' },
      { acronym: 'TPU', fullForm: 'Tensor Processing Unit', description: 'Google-designed ASIC optimized for tensor operations, specialized for machine learning workloads.' },
      { acronym: 'NPU', fullForm: 'Neural Processing Unit', description: 'A dedicated chip for neural network inference, commonly embedded in mobile and edge devices for on-device AI.' },
      { acronym: 'LPU', fullForm: 'Language Processing Unit', description: 'A specialized accelerator designed for efficient large language model inference with high throughput and low latency.' },
      { acronym: 'FP8/FP16', fullForm: 'Floating Point (8-bit/16-bit)', description: 'Reduced-precision floating-point formats that decrease memory and compute requirements with minimal accuracy loss.' },
      { acronym: 'INT8/INT4', fullForm: 'Integer Quantization Precision', description: 'Quantization formats that represent weights and activations as integers, drastically reducing model size and inference cost.' },
      { acronym: 'AWQ', fullForm: 'Activation-aware Weight Quantization', description: 'A quantization method that preserves the most important weight channels based on activation magnitudes for better accuracy.' },
      { acronym: 'GPTQ', fullForm: 'Generalized Post-Training Quantization', description: 'A one-shot weight quantization technique that uses second-order information to compress models to 4-bit with minimal degradation.' },
      { acronym: 'GGUF', fullForm: 'GPT-Generated Unified Format', description: 'A file format for storing quantized models for CPU and edge inference, supporting various precision levels and metadata.' },
      { acronym: 'GGML', fullForm: 'GPT-Generated Model Language', description: 'A tensor library and binary format that enables efficient CPU-based inference of large language models on commodity hardware.' },
      { acronym: 'ONNX', fullForm: 'Open Neural Network Exchange', description: 'An open standard for representing ML models, enabling interoperability between different training and inference frameworks.' },
      { acronym: 'FLOPs', fullForm: 'Floating Point Operations Per Second', description: 'A measure of computational throughput, commonly used to compare accelerator performance for AI workloads.' },
      { acronym: 'TTFT', fullForm: 'Time to First Token', description: 'The latency from request to the first generated token, a critical metric for interactive AI applications.' },
      { acronym: 'TPS', fullForm: 'Tokens Per Second', description: 'The generation throughput of a model during inference, measuring how quickly output tokens are produced.' },
    ],
  },
  {
    id: 'agentic-tools',
    name: 'Agentic AI & Tools',
    icon: 'Wrench',
    terms: [
      { acronym: 'Agentic AI', fullForm: 'Autonomous AI Systems', description: 'AI systems that plan, execute multi-step tasks, and use tools autonomously to achieve goals with minimal human intervention.' },
      { acronym: 'MCP', fullForm: 'Model Context Protocol', description: 'A standard protocol that lets AI models connect to external data sources and tools in a structured, secure way.' },
      { acronym: 'API', fullForm: 'Application Programming Interface', description: 'A set of protocols that allow software components to communicate, enabling AI services to be integrated into applications.' },
      { acronym: 'SDK', fullForm: 'Software Development Kit', description: 'A collection of libraries and tools that developers use to build applications for a specific platform or service.' },
      { acronym: 'UI/UX', fullForm: 'User Interface/User Experience', description: 'The design of how users interact with and experience an application, including layout, flow, and visual design.' },
    ],
  },
  {
    id: 'multimodal',
    name: 'Multimodal & I/O',
    icon: 'Eye',
    terms: [
      { acronym: 'TTS', fullForm: 'Text-to-Speech', description: 'Technology that converts written text into natural-sounding spoken audio using neural synthesis models.' },
      { acronym: 'STT', fullForm: 'Speech-to-Text', description: 'Technology that transcribes spoken audio into written text, also known as automatic speech recognition.' },
      { acronym: 'ASR', fullForm: 'Automatic Speech Recognition', description: 'The process of converting audio speech signals into text, enabling voice interfaces and transcription services.' },
      { acronym: 'OCR', fullForm: 'Optical Character Recognition', description: 'Technology that extracts text from images of documents, enabling digitization and searchable archives.' },
      { acronym: 'CV', fullForm: 'Computer Vision', description: 'A field of AI that enables machines to interpret and understand visual information from images and video.' },
      { acronym: 'CLI', fullForm: 'Command Line Interface', description: 'A text-based interface for interacting with software, where users type commands to perform tasks.' },
    ],
  },
  {
    id: 'benchmarks',
    name: 'Benchmarks & Evaluation',
    icon: 'BarChart3',
    terms: [
      { acronym: 'MMLU', fullForm: 'Massive Multitask Language Understanding', description: 'A benchmark of 57 subjects across STEM, humanities, and social sciences to measure broad knowledge in language models.' },
      { acronym: 'GSM8K', fullForm: 'Grade School Math 8K', description: 'A dataset of 8,500 grade-school math word problems that tests multi-step arithmetic and reasoning ability.' },
      { acronym: 'MATH', fullForm: 'Mathematical Problem-Solving Benchmark', description: 'A challenging dataset of competition-level math problems that tests advanced mathematical reasoning in models.' },
      { acronym: 'HELM', fullForm: 'Holistic Evaluation of Language Models', description: 'A framework that evaluates language models across accuracy, robustness, fairness, efficiency, and safety dimensions.' },
      { acronym: 'HumanEval', fullForm: 'Code Evaluation Benchmark', description: 'A benchmark of 164 hand-written programming problems that tests functional code generation and correctness in models.' },
      { acronym: 'SWE-bench', fullForm: 'Software Engineering Benchmark', description: 'A benchmark of real GitHub issues that evaluates the ability of AI to resolve multi-file software engineering tasks.' },
      { acronym: 'ROUGE', fullForm: 'Recall-Oriented Understudy for Gisting Evaluation', description: 'A set of metrics for evaluating text summarization by measuring n-gram overlap between generated and reference summaries.' },
      { acronym: 'BLEU', fullForm: 'Bilingual Evaluation Understudy', description: 'A metric for evaluating machine translation quality by measuring n-gram precision against human reference translations.' },
    ],
  },
  {
    id: 'safety',
    name: 'Safety & Alignment Testing',
    icon: 'ShieldAlert',
    terms: [
      { acronym: 'Align', fullForm: 'Alignment (Ethics, Safety, Guidelines)', description: 'The practice of ensuring AI systems behave in accordance with human values, ethical principles, and safety guidelines.' },
      { acronym: 'Red Teaming', fullForm: 'Adversarial Testing for Safety', description: 'Systematically probing AI models with adversarial inputs to discover vulnerabilities, harmful outputs, and edge cases.' },
      { acronym: 'Jailbreaking', fullForm: 'Bypassing Safety Guardrails', description: 'Techniques that attempt to circumvent AI safety filters and restrictions to elicit disallowed or harmful content.' },
    ],
  },
  {
    id: 'learning-paradigms',
    name: 'Learning Paradigms',
    icon: 'GraduationCap',
    terms: [
      { acronym: 'SSL', fullForm: 'Self-Supervised Learning', description: 'A training paradigm where the model learns representations from unlabeled data by creating supervisory signals from the data itself.' },
      { acronym: 'USL', fullForm: 'Unsupervised Learning', description: 'A paradigm where models discover patterns and structure in data without any labels or explicit supervision.' },
      { acronym: 'SL', fullForm: 'Supervised Learning', description: 'A paradigm where models learn from labeled examples, mapping inputs to known outputs to generalize to new data.' },
      { acronym: 'ZSL', fullForm: 'Zero-Shot Learning', description: 'The ability of a model to perform tasks on classes or concepts it has never seen during training.' },
      { acronym: 'FSL', fullForm: 'Few-Shot Learning', description: 'Learning to perform a task from only a handful of labeled examples, often through meta-learning or in-context examples.' },
      { acronym: 'ICL', fullForm: 'In-Context Learning', description: 'The ability of large language models to learn new tasks from examples provided in the prompt, without weight updates.' },
      { acronym: 'CL', fullForm: 'Continual Learning', description: 'A paradigm where models learn new tasks sequentially without forgetting previously learned knowledge.' },
      { acronym: 'TL', fullForm: 'Transfer Learning', description: 'Reusing knowledge from a pre-trained model on a related task, reducing the data and compute needed for new problems.' },
      { acronym: 'AutoML', fullForm: 'Automated Machine Learning', description: 'Systems that automate the ML pipeline — model selection, hyperparameter tuning, and feature engineering — without manual intervention.' },
    ],
  },
];

export function getAllTerms(): AITerm[] {
  return AI_KNOWLEDGE_CATEGORIES.flatMap((c) => c.terms);
}

export function searchTerms(query: string): { term: AITerm; category: string }[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results: { term: AITerm; category: string }[] = [];
  for (const cat of AI_KNOWLEDGE_CATEGORIES) {
    for (const term of cat.terms) {
      if (
        term.acronym.toLowerCase().includes(q) ||
        term.fullForm.toLowerCase().includes(q) ||
        term.description.toLowerCase().includes(q)
      ) {
        results.push({ term, category: cat.name });
      }
    }
  }
  return results;
}
