'use client';

import { Container } from '@/components/container';
import { DFSVisualization } from '@/components/DFSVisualization';

export default function DFSPage() {
  return (
    <Container className="mt-16 lg:mt-32">
      <div className="xl:relative">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
            Depth-First Search
          </h1>
          <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
            Depth-First Search (DFS) is a fundamental graph traversal algorithm that explores as far as possible along each branch before backtracking.
          </p>
          
          <div className="mt-8">
            <DFSVisualization />
          </div>

          <div className="mt-12 space-y-6 text-base text-zinc-600 dark:text-zinc-400">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
              Understanding the Visualization
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                  Graph Elements
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Unvisited nodes are shown in dark gray</li>
                  <li>The current node pulses in teal</li>
                  <li>Visited nodes are shown in darker teal</li>
                  <li>Nodes in the stack are highlighted</li>
                  <li>Traversed edges are shown in teal</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                  Algorithm Steps
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Start at the root node (A)</li>
                  <li>Push unvisited neighbors onto the stack</li>
                  <li>Visit nodes in depth-first order</li>
                  <li>Backtrack when a node has no unvisited neighbors</li>
                  <li>Continue until all nodes are visited</li>
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                Controls
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Use the play/pause button to start/stop the animation</li>
                <li>Step through the algorithm using the arrow buttons</li>
                <li>Reset the visualization with the reset button</li>
                <li>Adjust animation speed using the slider</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
} 