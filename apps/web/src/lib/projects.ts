export const projects = [
  {
    slug: 'aci',
    title: 'ACI',
    description:
      'A Rust-first codebase indexer that turns repositories into queryable software graphs.',
    category: 'Code Intelligence',
    status: 'Active',
    role: 'Systems Builder',
    stack: 'Rust, Tree-sitter, graph indexes, CLI tooling',
    overview:
      'ACI walks source repositories, extracts a neutral graph of files, symbols, imports, exports, calls, references, and package dependencies, then stores that graph for fast local queries and export.',
    why:
      'Developer tools need durable code understanding, not disposable prompt context. ACI keeps parser-specific details behind adapters and gives downstream tools a stable model for lookup, traversal, impact analysis, and semantic enrichment.',
    workflow: [
      {
        title: 'Discover and filter the repository',
        description:
          'The indexer walks the target repo with ignore rules, skips unsupported, binary, generated, and vendor paths, then classifies each source file by language.',
      },
      {
        title: 'Fingerprint files for incremental work',
        description:
          'Each candidate file is hashed so unchanged files can be reused. Changed files become a bounded indexing plan instead of forcing a full rebuild.',
      },
      {
        title: 'Extract structural facts through adapters',
        description:
          'Language adapters use Tree-sitter where available, fall back to scanners when needed, and emit symbols, imports, exports, calls, references, packages, spans, and provenance.',
      },
      {
        title: 'Normalize into the core graph model',
        description:
          'Adapter-specific details collapse into deterministic IDs and neutral graph records so query, storage, and export code do not need to know which parser produced a fact.',
      },
      {
        title: 'Write replaceable file partitions',
        description:
          'ACI stores graph data by file partition with compact manifests and delta logs, so an incremental update can replace one file without rewriting unrelated graph data.',
      },
      {
        title: 'Query or export the graph',
        description:
          'The CLI and library layers read the store for symbol lookup, dependency traversal, callers, callees, references, impact analysis, JSONL, SCIP, LSIF, and KiteDB-shaped exports.',
      },
    ],
    architecture: [
      {
        name: 'aci-core',
        description:
          'Owns the graph model, deterministic IDs, source spans, language types, diagnostics, and fact confidence.',
      },
      {
        name: 'aci-indexer',
        description:
          'Handles discovery, fingerprinting, scheduling, cache invalidation, and pipeline orchestration.',
      },
      {
        name: 'aci-adapters',
        description:
          'Contains language detection, Tree-sitter extraction, scanner fallback, and package/dependency extraction.',
      },
      {
        name: 'aci-store',
        description:
          'Persists manifests, packed partitions, delta logs, snapshots, and adjacency-oriented indexes.',
      },
      {
        name: 'aci-query',
        description:
          'Provides symbol lookup, dependency traversal, callers, callees, references, packages, and impact queries.',
      },
      {
        name: 'aci-export',
        description:
          'Projects the internal graph into JSONL, SCIP-shaped JSON, LSIF-shaped JSON, and KiteDB-compatible records.',
      },
    ],
    systems: [
      {
        title: 'Neutral graph model',
        description:
          'Normalizes files, symbols, spans, dependencies, references, and provenance into shared Rust crates.',
      },
      {
        title: 'Incremental indexing',
        description:
          'Hashes files, skips unchanged paths, and replaces per-file graph partitions without rewriting the full store.',
      },
      {
        title: 'Query and export layer',
        description:
          'Supports symbol lookup, dependency traversal, callers, references, impact sets, JSONL, SCIP, LSIF, and KiteDB-shaped exports.',
      },
    ],
  },
  {
    slug: 'heimdaal',
    title: 'Heimdaal',
    description:
      'AI-native code review systems that understand intent, context, and architecture.',
    category: 'Review Systems',
    status: 'Active',
    role: 'Founder / Builder',
    stack: 'TypeScript, GitLab, embeddings, code graph',
    overview:
      'Heimdaal is an AI-native code review platform that helps teams review code with deeper context, not just syntax-level checks.',
    why:
      'Most AI review tools stay shallow. Heimdaal surfaces cross-file impact, standards alignment, and architectural risk.',
    systems: [
      {
        title: 'Codebase understanding',
        description: 'Builds a graph of your codebase.',
      },
      {
        title: 'Intent-aware analysis',
        description: 'Analyzes changes with awareness of intent and patterns.',
      },
      {
        title: 'Actionable feedback',
        description: 'Surfaces issues with clear reasoning and suggestions.',
      },
    ],
  },
  {
    slug: 'kitedb',
    title: 'KiteDB',
    externalUrl: 'https://kitedb.vercel.app/',
    description:
      'Graph database platforms for complex relationships and retrieval.',
    category: 'Graph Database',
    status: 'Active',
    role: 'Systems Builder',
    stack: 'Graph storage, retrieval, TypeScript, infrastructure',
    overview:
      'KiteDB explores graph-backed data systems for modeling complex software, knowledge, and operational relationships.',
    why:
      'Dense relationship data becomes hard to query and reason about in flat systems. KiteDB keeps connections first-class.',
    systems: [
      {
        title: 'Relationship modeling',
        description: 'Represents entities and dependencies as navigable graph data.',
      },
      {
        title: 'Retrieval layer',
        description: 'Supports context-rich queries across connected information.',
      },
      {
        title: 'Operational tooling',
        description: 'Turns graph structure into inspectable developer workflows.',
      },
    ],
  },
  {
    slug: 'experiments',
    title: 'Experiments',
    description:
      'Exploring AI tools and infrastructure that empower developers.',
    category: 'AI Tools',
    status: 'Ongoing',
    role: 'Research / Builder',
    stack: 'Language models, evals, agents, developer tools',
    overview:
      'Experiments collects focused prototypes around AI-assisted programming, evaluation, and infrastructure.',
    why:
      'Useful developer tools need tight feedback loops. These experiments test what is practical before it becomes product-shaped.',
    systems: [
      {
        title: 'Prototype loops',
        description: 'Builds small tools to test concrete developer workflows.',
      },
      {
        title: 'Evaluation harnesses',
        description: 'Measures behavior with repeatable tasks and checks.',
      },
      {
        title: 'Infrastructure notes',
        description: 'Documents patterns that survive real implementation pressure.',
      },
    ],
  },
] as const

export type Project = (typeof projects)[number]
