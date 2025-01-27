import React from 'react';
import { AlgorithmVisualizer } from './AlgorithmVisualizer';

// Define the graph structure
interface Node {
  id: string;
  x: number;
  y: number;
  connections: string[];
}

interface GraphState {
  nodes: Node[];
  visited: string[];
  stack: string[];
  current: string | null;
}

// Create a sample binary tree graph
const binaryTreeGraph: Node[] = [
  { id: 'A', x: 100, y: 30, connections: ['B', 'C'] },
  { id: 'B', x: 50, y: 80, connections: ['A', 'D', 'E'] },
  { id: 'C', x: 150, y: 80, connections: ['A', 'F', 'G'] },
  { id: 'D', x: 25, y: 130, connections: ['B'] },
  { id: 'E', x: 75, y: 130, connections: ['B'] },
  { id: 'F', x: 125, y: 130, connections: ['C'] },
  { id: 'G', x: 175, y: 130, connections: ['C'] },
];

// Generate DFS steps
function generateDFSSteps(graph: Node[]): { state: GraphState; description: string }[] {
  const steps: { state: GraphState; description: string }[] = [];
  const visited = new Set<string>();
  const stack: string[] = [];
  
  // Initial state
  steps.push({
    state: {
      nodes: graph,
      visited: [],
      stack: [],
      current: null,
    },
    description: 'Initial state: No nodes have been visited yet.',
  });

  function dfs(startNode: string) {
    stack.push(startNode);
    
    steps.push({
      state: {
        nodes: graph,
        visited: Array.from(visited),
        stack: [...stack],
        current: startNode,
      },
      description: `Pushed ${startNode} onto the stack.`,
    });

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      
      if (!visited.has(current)) {
        visited.add(current);
        steps.push({
          state: {
            nodes: graph,
            visited: Array.from(visited),
            stack: [...stack],
            current,
          },
          description: `Visiting node ${current}.`,
        });

        // Get unvisited neighbors
        const node = graph.find(n => n.id === current)!;
        const unvisitedNeighbors = node.connections
          .filter(n => !visited.has(n))
          // Sort to ensure we visit left children before right children in the binary tree
          .sort((a, b) => {
            const nodeA = graph.find(n => n.id === a)!;
            const nodeB = graph.find(n => n.id === b)!;
            return nodeA.x - nodeB.x;
          });

        for (const neighbor of unvisitedNeighbors) {
          stack.push(neighbor);
          steps.push({
            state: {
              nodes: graph,
              visited: Array.from(visited),
              stack: [...stack],
              current: neighbor,
            },
            description: `Found unvisited neighbor ${neighbor} of ${current}. Adding to stack.`,
          });
        }
      } else {
        stack.pop();
        steps.push({
          state: {
            nodes: graph,
            visited: Array.from(visited),
            stack: [...stack],
            current: stack[stack.length - 1] || null,
          },
          description: `${current} has been fully explored. Removing from stack.`,
        });
      }
    }
  }

  dfs('A'); // Start DFS from node A
  return steps;
}

// Render function for the graph visualization
function renderGraph(state: GraphState) {
  return (
    <svg className="w-full h-full" viewBox="0 0 200 160">
      {/* SVG Filters for Matrix glow effects */}
      <defs>
        <filter id="matrix-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor="#00ff00" floodOpacity="0.3" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feMerge>
            <feMergeNode in="glow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Draw edges */}
      {state.nodes.map(node =>
        node.connections.map(targetId => {
          const target = state.nodes.find(n => n.id === targetId)!;
          const isActive = state.visited.includes(node.id) && state.visited.includes(targetId);
          const isInStack = state.stack.includes(node.id) && state.stack.includes(targetId);
          
          // Calculate the angle between nodes
          const dx = target.x - node.x;
          const dy = target.y - node.y;
          const angle = Math.atan2(dy, dx);
          
          // Circle radius is 20, calculate where the line should start/end
          const radius = 20;
          const startX = node.x + Math.cos(angle) * radius;
          const startY = node.y + Math.sin(angle) * radius;
          const endX = target.x - Math.cos(angle) * radius;
          const endY = target.y - Math.sin(angle) * radius;
          
          return (
            <line
              key={`${node.id}-${targetId}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={
                isActive
                  ? '#00ff00' // Bright green for visited edges
                  : isInStack
                  ? '#00cc00' // Medium green for stack edges
                  : '#004400' // Dark green for unvisited
              }
              strokeOpacity={
                isActive
                  ? 0.8
                  : isInStack
                  ? 0.5
                  : 0.3
              }
              strokeWidth={isActive || isInStack ? "2" : "1.5"}
              className="transition-colors duration-200 matrix-edge"
              strokeDasharray={isActive ? "4" : "3"}
              strokeLinecap="round"
            />
          );
        }),
      )}

      {/* Draw nodes */}
      {state.nodes.map(node => (
        <g key={node.id}>
          {/* Highlight circle for current node */}
          {state.current === node.id && (
            <circle
              cx={node.x}
              cy={node.y}
              r="24"
              fill="none"
              stroke="#00ff00"
              strokeOpacity="0.5"
              strokeWidth="2"
              className="animate-pulse"
            />
          )}
          
          {/* Node circle */}
          <circle
            cx={node.x}
            cy={node.y}
            r="20"
            fill={
              state.current === node.id
                ? '#00ff00' // Bright green for current
                : state.visited.includes(node.id)
                ? '#00cc00' // Medium green for visited
                : state.stack.includes(node.id)
                ? '#008800' // Darker green for stack
                : '#004400' // Darkest green for unvisited
            }
            fillOpacity={
              state.current === node.id
                ? 0.3
                : state.visited.includes(node.id)
                ? 0.2
                : state.stack.includes(node.id)
                ? 0.15
                : 0.1
            }
            className="transition-all duration-200"
            stroke={
              state.current === node.id
                ? '#00ff00'
                : state.visited.includes(node.id)
                ? '#00cc00'
                : state.stack.includes(node.id)
                ? '#008800'
                : '#004400'
            }
            strokeOpacity="0.8"
          />
          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#00ff00"
            fillOpacity="1"
            fontSize="14"
            className="font-mono"
            style={{
              textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
            }}
          >
            {node.id}
          </text>
        </g>
      ))}
    </svg>
  );
}

// Render function for current state
function renderCurrentState(state: GraphState) {
  return (
    <div className="space-y-2 font-mono">
      <div className="flex items-center gap-2">
        <span className="text-[#00ff00]">Current Node:</span>
        <span className="px-2 py-1 rounded bg-[#00ff00]/10 border border-[#00ff00]/30">
          <span className="text-[#00ff00]">
            {state.current || 'None'}
          </span>
        </span>
      </div>
      <div>
        <span className="text-[#00ff00]/90">Visited:</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {state.visited.map(nodeId => (
            <span key={nodeId} className="px-1.5 py-0.5 rounded bg-[#00ff00]/10 border border-[#00ff00]/30 text-xs text-[#00ff00]">
              {nodeId}
            </span>
          ))}
          {state.visited.length === 0 && (
            <span className="text-[#00ff00]/50 text-xs italic">None</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Render function for stack state
function renderStack(state: GraphState) {
  return (
    <div className="font-mono">
      <div className="flex flex-col-reverse gap-1">
        {state.stack.map((nodeId, index) => (
          <div
            key={`${nodeId}-${index}`}
            className={`px-3 py-1.5 rounded border ${
              index === state.stack.length - 1
                ? 'bg-[#00ff00]/10 border-[#00ff00]/30 text-[#00ff00]'
                : 'border-[#00ff00]/20 text-[#00ff00]/70'
            }`}
          >
            {nodeId}
          </div>
        ))}
        {state.stack.length === 0 && (
          <div className="text-[#00ff00]/50 text-xs italic">Stack is empty</div>
        )}
      </div>
    </div>
  );
}

export function DFSVisualization() {
  const steps = generateDFSSteps(binaryTreeGraph);

  return (
    <div className="w-full">
      <AlgorithmVisualizer
        steps={steps}
        renderVisualization={renderGraph}
        renderCurrentState={renderCurrentState}
        renderDataStructure={renderStack}
        className="min-h-[600px]"
        speed={1000}
        title="Matrix DFS Protocol v4.2.1"
      />
    </div>
  );
} 