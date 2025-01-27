import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TerminalWindow } from './TerminalWindow';

interface Algorithm {
  id: string;
  name: string;
  description: string;
  path: string;
  category: string;
}

const algorithms: Algorithm[] = [
  {
    id: 'dfs',
    name: 'Depth-First Search',
    description: 'Graph traversal algorithm that explores as far as possible along each branch before backtracking.',
    path: '/algorithms/dfs',
    category: 'graph',
  },
  {
    id: 'bfs',
    name: 'Breadth-First Search',
    description: 'Graph traversal algorithm that explores all vertices at the present depth before moving on to vertices at the next depth level.',
    path: '/algorithms/bfs',
    category: 'graph',
  },
  // Add more algorithms here
];

const MATRIX_QUOTES = [
  "Wake up, Neo...",
  "The Matrix has you...",
  "Follow the white rabbit.",
  "Knock, knock, Neo.",
  "I know kung fu.",
  "There is no spoon.",
  "Free your mind.",
  "Welcome to the desert of the real.",
  "What is real? How do you define real?",
  "Unfortunately, no one can be told what the Matrix is. You have to see it for yourself.",
];

const INITIAL_MESSAGE = `
Matrix v4.2.1 - Algorithm Visualization System
============================================

Type 'help' for available commands.
Type 'matrix' for a surprise...
`;

export function AlgorithmTerminal() {
  const router = useRouter();
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([INITIAL_MESSAGE]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addToHistory = (text: string) => {
    setHistory(prev => [...prev, text]);
  };

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmd: string) => {
    // Add command to history
    if (cmd.trim()) {
      setCommandHistory(prev => [...prev, cmd]);
      setHistoryIndex(-1);
    }

    addToHistory(`> ${cmd}`);

    const parts = cmd.trim().toLowerCase().split(' ');
    const mainCommand = parts[0];

    switch (mainCommand) {
      case 'help':
        addToHistory(`
Available commands:
==================
ls                    List available algorithms
cd <algorithm>        Navigate to an algorithm
clear                 Clear terminal
help                  Show this help message
cat <algorithm>       Show algorithm details
`);
        break;

      case 'ls':
        const category = parts[1];
        const filteredAlgos = category
          ? algorithms.filter(a => a.category === category)
          : algorithms;

        addToHistory('Available algorithms:');
        addToHistory('===================');
        filteredAlgos.forEach(algo => {
          addToHistory(`${algo.id.padEnd(15)} - ${algo.name}`);
        });
        break;

      case 'cd':
        const target = parts[1];
        if (!target) {
          addToHistory('Error: Please specify an algorithm');
          break;
        }

        const algo = algorithms.find(a => a.id === target);
        if (algo) {
          addToHistory(`Navigating to ${algo.name}...`);
          setTimeout(() => router.push(algo.path), 500);
        } else {
          addToHistory(`Error: Algorithm '${target}' not found`);
        }
        break;

      case 'cat':
        const algoId = parts[1];
        if (!algoId) {
          addToHistory('Error: Please specify an algorithm');
          break;
        }

        const algoDetails = algorithms.find(a => a.id === algoId);
        if (algoDetails) {
          addToHistory(`
${algoDetails.name}
${'='.repeat(algoDetails.name.length)}
Category: ${algoDetails.category}
Path: ${algoDetails.path}

Description:
${algoDetails.description}
`);
        } else {
          addToHistory(`Error: Algorithm '${algoId}' not found`);
        }
        break;

      case 'clear':
        setHistory([INITIAL_MESSAGE]);
        break;

      case 'matrix':
        const randomQuotes = [...MATRIX_QUOTES]
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        // Add matrix quotes with delays
        addToHistory('Initiating the Matrix sequence...');
        setTimeout(() => {
          randomQuotes.forEach((quote, index) => {
            setTimeout(() => {
              addToHistory(`\n${quote}`);
            }, (index + 1) * 1500);
          });
        }, 1000);
        break;

      case 'redpill':
        addToHistory(`
This is your last chance.
After this, there is no turning back.

You take the blue pill - the story ends, you wake up in your bed and believe whatever you want to believe.
You take the red pill - you stay in Wonderland and I show you how deep the rabbit hole goes.

Type 'bluepill' or 'redpill' to choose...
`);
        break;

      case 'bluepill':
        addToHistory('\nThe story ends. Wake up in your bed.\n*Terminal shutting down*');
        setTimeout(() => {
          setHistory([INITIAL_MESSAGE]);
        }, 3000);
        break;

      case 'rabbit':
        addToHistory(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀⠀⠀⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⡖⠁⠀⠀⠀⠀⠀⠀⠈⢲⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣼⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣧⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣸⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣇⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇⠀⢀⣀⣤⣤⣤⣤⣀⡀⠀⢸⣿⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣔⢿⡿⠟⠛⠛⠻⢿⡿⣢⣿⣿⡟⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣀⣤⣶⣾⣿⣿⣿⣷⣤⣀⡀⢀⣀⣤⣾⣿⣿⣿⣷⣶⣤⡀⠀⠀⠀⠀
⠀⠀⢠⣾⣿⡿⠿⠿⠿⣿⣿⣿⣿⡿⠏⠻⢿⣿⣿⣿⣿⠿⠿⠿⢿⣿⣷⡀⠀⠀
⠀⢠⡿⠋⠁⠀⠀⢸⣿⡇⠉⠻⣿⠇⠀⠀⠸⣿⡿⠋⢰⣿⡇⠀⠀⠈⠙⢿⡄⠀
⠀⡿⠁⠀⠀⠀⠀⠘⣿⣷⡀⠀⠰⣿⣶⣶⣿⡎⠀⢀⣾⣿⠇⠀⠀⠀⠀⠈⢿⠀
⠀⡇⠀⠀⠀⠀⠀⠀⠹⣿⣷⣄⠀⣿⣿⣿⣿⠀⣠⣾⣿⠏⠀⠀⠀⠀⠀⠀⢸⠀
⠀⠁⠀⠀⠀⠀⠀⠀⠀⠈⠻⢿⢇⣿⣿⣿⣿⡸⣿⠟⠁⠀⠀⠀⠀⠀⠀⠀⠈⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⣿⣿⣿⣧⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠐⢤⣀⣀⢀⣀⣠⣴⣿⣿⠿⠋⠙⠿⣿⣿⣦⣄⣀⠀⠀⣀⡠⠂⠀⠀⠀
⠀⠀⠀⠀⠀⠈⠉⠛⠛⠛⠛⠉⠀⠀⠀⠀⠀⠈⠉⠛⠛⠛⠛⠋⠁⠀⠀⠀⠀⠀

Follow the white rabbit...
`);
        break;

      case 'spoon':
        addToHistory(`
Do not try and bend the spoon. That's impossible.
Instead... only try to realize the truth.

There is no spoon.

Then you'll see that it is not the spoon that bends,
it is only yourself.
`);
        break;

      default:
        if (cmd.trim()) {
          addToHistory(`Command not found: ${mainCommand}`);
          addToHistory('Type "help" for available commands');
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(command);
      setCommand('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <TerminalWindow title="Matrix Terminal" className="min-h-[60vh] overflow-y-auto">
      {/* <div className="matrix-chars" /> */}
      <div className="flex flex-col " onClick={focusInput}>
        {/* Terminal output */}
        <div
          ref={scrollRef}
          className="flex-1 font-mono text-sm matrix-text space-y-1 mb-4 overflow-auto h-[60vh] max-h-[60vh] terminal-scrollbar"
        >
          {history.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap matrix-decode" data-value={line}>{line}</div>
          ))}
        </div>

        {/* Command input */}
        <div className="flex items-center font-mono text-sm">
          <span className="matrix-text">{`>`}</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 ml-2 bg-transparent matrix-text outline-none matrix-cursor"
            autoFocus
          />
        </div>
      </div>
    </TerminalWindow>
  );
} 
