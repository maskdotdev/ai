'use client';

import { Container } from '@/components/container';
import { AlgorithmTerminal } from '@/components/AlgorithmTerminal';

export default function AlgorithmsPage() {
  return (
    <Container className="mt-16 lg:mt-32">
      <div className="xl:relative">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
            Algorithm Visualizations
          </h1>
          <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
            Interactive visualizations of various algorithms. Use the terminal below to navigate and explore different algorithms.
            Type <code className="font-mono text-emerald-500 bg-zinc-800/30 px-1.5 py-0.5 rounded">help</code> to see available commands.
          </p>
          
          <div className="mt-8">
            <AlgorithmTerminal />
          </div>

          <div className="mt-12 space-y-6 text-base text-zinc-600 dark:text-zinc-400">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
              Available Commands
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                  Navigation
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-baseline gap-2">
                    <code className="font-mono text-emerald-500 bg-zinc-800/30 px-1.5 py-0.5 rounded">ls</code>
                    <span>List available algorithms</span>
                  </li>
                  <li className="flex items-baseline gap-2">
                    <code className="font-mono text-emerald-500 bg-zinc-800/30 px-1.5 py-0.5 rounded">cd &lt;algorithm&gt;</code>
                    <span>Navigate to an algorithm</span>
                  </li>
                  <li className="flex items-baseline gap-2">
                    <code className="font-mono text-emerald-500 bg-zinc-800/30 px-1.5 py-0.5 rounded">cat &lt;algorithm&gt;</code>
                    <span>Show algorithm details</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                  Terminal Controls
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-baseline gap-2">
                    <code className="font-mono text-emerald-500 bg-zinc-800/30 px-1.5 py-0.5 rounded">help</code>
                    <span>Show help message</span>
                  </li>
                  <li className="flex items-baseline gap-2">
                    <code className="font-mono text-emerald-500 bg-zinc-800/30 px-1.5 py-0.5 rounded">clear</code>
                    <span>Clear terminal output</span>
                  </li>
                  <li className="flex items-baseline gap-2">
                    <kbd className="font-mono text-emerald-500 bg-zinc-800/30 px-1.5 py-0.5 rounded">↑</kbd>
                    <span>Previous command</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                Example Usage
              </h3>
              <div className="font-mono text-sm space-y-1 bg-zinc-800/30 p-4 rounded-lg">
                <div className="text-emerald-500">algorithm@visualization:~$ ls</div>
                <div className="text-emerald-500/70">dfs            - Depth-First Search</div>
                <div className="text-emerald-500/70">bfs            - Breadth-First Search</div>
                <div className="text-emerald-500">algorithm@visualization:~$ cat dfs</div>
                <div className="text-emerald-500/70">Depth-First Search</div>
                <div className="text-emerald-500/70">Category: graph</div>
                <div className="text-emerald-500/70">Description: Graph traversal algorithm that explores as far as possible along each branch before backtracking.</div>
                <div className="text-emerald-500">algorithm@visualization:~$ cd dfs</div>
                <div className="text-emerald-500/70">Navigating to DFS visualization...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
} 