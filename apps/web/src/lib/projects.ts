export const projects = [
  {
    slug: 'argus',
    title: 'Argus',
    description:
      'AI-native code review systems that understand intent, context, and architecture.',
    category: 'Review Systems',
    status: 'Active',
    role: 'Founder / Builder',
    stack: 'TypeScript, GitLab, embeddings, code graph',
    overview:
      'Argus is an AI-native code review platform that helps teams review code with deeper context, not just syntax-level checks.',
    why:
      'Most AI review tools stay shallow. Argus surfaces cross-file impact, standards alignment, and architectural risk.',
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
    slug: 'sombra',
    title: 'Sombra',
    description:
      'Graph database platforms for complex relationships and retrieval.',
    category: 'Graph Database',
    status: 'Active',
    role: 'Systems Builder',
    stack: 'Graph storage, retrieval, TypeScript, infrastructure',
    overview:
      'Sombra explores graph-backed data systems for modeling complex software, knowledge, and operational relationships.',
    why:
      'Dense relationship data becomes hard to query and reason about in flat systems. Sombra keeps connections first-class.',
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
