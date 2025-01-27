import React, { useState, useCallback, useRef } from 'react';
import { TerminalWindow, TerminalBlock } from './TerminalWindow';

interface Step<T> {
  state: T;  // The state of the algorithm at this step
  description: string;  // Text description of what happened in this step
}

interface AlgorithmVisualizerProps<T> {
  steps: Step<T>[];  // Array of algorithm steps
  renderVisualization: (state: T) => React.ReactNode;  // Function to render the main visualization
  renderDataStructure?: (state: T) => React.ReactNode;  // Optional function to render the data structure state
  renderCurrentState?: (state: T) => React.ReactNode;  // Optional function to render the current state
  className?: string;
  speed?: number; // Speed of animation in milliseconds
  title?: string; // Title for the terminal window
}

export function AlgorithmVisualizer<T>({
  steps,
  renderVisualization,
  renderDataStructure,
  renderCurrentState,
  className = '',
  speed = 1000,
  title,
}: AlgorithmVisualizerProps<T>) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = steps[currentStepIndex];

  const goToStep = useCallback((index: number) => {
    setCurrentStepIndex(Math.max(0, Math.min(index, steps.length - 1)));
  }, [steps.length]);

  const play = useCallback(() => {
    setIsPlaying(true);
    playIntervalRef.current = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
          }
          return prev;
        }
        return prev + 1;
      });
    }, speed);
  }, [steps.length, speed]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    pause();
    goToStep(0);
  }, [pause, goToStep]);

  // Cleanup interval on unmount
  React.useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  return (
    <TerminalWindow title={title} className={className}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Main visualization panel with floating controls */}
        <div className="group relative flex-1 min-h-[400px] rounded-md border border-zinc-800 bg-black/30 backdrop-blur-sm p-4">
          {/* Terminal prompt */}
          <div className="absolute top-4 left-4 font-mono text-xs text-[#00ff00]/90 animate-text-glow">
            root@matrix:~/sys/core/algorithms$ ./execute_protocol.sh
          </div>

          {/* Visualization area */}
          <div className="mt-8">
            {renderVisualization(currentStep.state)}
          </div>

          {/* Floating controls */}
          <div className="absolute left-1/2 bottom-1 -translate-x-1/2">
            <div className="flex items-center gap-2 bg-black/80 backdrop-blur rounded-lg border border-zinc-800 p-2 shadow-lg">
              <button
                onClick={() => goToStep(currentStepIndex - 1)}
                disabled={currentStepIndex === 0}
                className="px-3 py-1.5 rounded bg-zinc-900 font-mono text-sm text-emerald-500 hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-zinc-900 transition-colors duration-150"
                aria-label="Previous step"
              >
                prev
              </button>

              <button
                onClick={isPlaying ? pause : play}
                className="px-3 py-1.5 rounded bg-zinc-900 font-mono text-sm text-emerald-500 hover:bg-zinc-800 transition-colors duration-150"
              >
                {isPlaying ? 'pause' : 'play'}
              </button>

              <button
                onClick={reset}
                className="px-3 py-1.5 rounded bg-zinc-900 font-mono text-sm text-emerald-500 hover:bg-zinc-800 transition-colors duration-150"
              >
                reset
              </button>

              <button
                onClick={() => goToStep(currentStepIndex + 1)}
                disabled={currentStepIndex === steps.length - 1}
                className="px-3 py-1.5 rounded bg-zinc-900 font-mono text-sm text-emerald-500 hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-zinc-900 transition-colors duration-150"
                aria-label="Next step"
              >
                next
              </button>
            </div>
          </div>
        </div>

        {/* Right side panels */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          {/* Steps panel */}
          <TerminalBlock title="Algorithm Steps">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span>Step [{currentStepIndex + 1}/{steps.length}]</span>
                <span>{Math.round((currentStepIndex / (steps.length - 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-1">
                <div
                  className="bg-emerald-500 h-1 rounded-full transition-all duration-200 [box-shadow:_0_0_8px_rgba(16,185,129,0.4)]"
                  style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />
              </div>
              <div className="mt-4 font-mono text-xs leading-relaxed">
                <span className="text-emerald-500">$</span> {currentStep.description}
              </div>
            </div>
          </TerminalBlock>

          {/* Current state panel */}
          {renderCurrentState && (
            <TerminalBlock title="Current State">
              {renderCurrentState(currentStep.state)}
            </TerminalBlock>
          )}

          {/* Data structure panel */}
          {renderDataStructure && (
            <TerminalBlock title="Data Structure">
              {renderDataStructure(currentStep.state)}
            </TerminalBlock>
          )}

          {/* Speed control */}
          {/* <div className="mt-auto font-mono"> */}
          {/*   <label className="block text-xs text-emerald-500/70 mb-2"> */}
          {/*     $ speed = {speed}ms */}
          {/*   </label> */}
          {/*   <input */}
          {/*     type="range" */}
          {/*     min="100" */}
          {/*     max="2000" */}
          {/*     step="100" */}
          {/*     value={speed} */}
          {/*     onChange={(e) => { */}
          {/*       const newSpeed = Number(e.target.value); */}
          {/*       if (isPlaying) { */}
          {/*         pause(); */}
          {/*         setTimeout(() => play(), 0); */}
          {/*       } */}
          {/*     }} */}
          {/*     className="w-full accent-emerald-500" */}
          {/*   /> */}
          {/* </div> */}
        </div>
      </div>
    </TerminalWindow>
  );
} 
