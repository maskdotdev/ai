import React from 'react';

interface TerminalWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function TerminalWindow({ title = 'Algorithm Visualization', children, className = '' }: TerminalWindowProps) {
  return (
    <div className={`group relative overflow-hidden rounded-lg border border-[#00ff00]/20 bg-black shadow-2xl ${className}`}>
      {/* Matrix rain effect */}
      <div className="matrix-background">
        {/* Terminal header with traffic lights */}
        <div className="relative flex h-10 items-center border-b border-[#00ff00]/20 bg-black/80 px-4">
          <div className="absolute left-4 flex items-center gap-2">
            <button className="group/btn h-3 w-3 rounded-full bg-red-500/20 shadow-lg transition-all duration-150 hover:bg-red-500/40 hover:shadow-red-500/50">
              <span className="absolute hidden whitespace-nowrap text-xs text-[#00ff00]/70 group-hover/btn:inline-block">close</span>
            </button>
            <button className="group/btn h-3 w-3 rounded-full bg-yellow-500/20 shadow-lg transition-all duration-150 hover:bg-yellow-500/40 hover:shadow-yellow-500/50">
              <span className="absolute hidden whitespace-nowrap text-xs text-[#00ff00]/70 group-hover/btn:inline-block">minimize</span>
            </button>
            <button className="group/btn h-3 w-3 rounded-full bg-green-500/20 shadow-lg transition-all duration-150 hover:bg-green-500/40 hover:shadow-green-500/50">
              <span className="absolute hidden whitespace-nowrap text-xs text-[#00ff00]/70 group-hover/btn:inline-block">zoom</span>
            </button>
          </div>
          <div className="flex-1 text-center">
            <span className="text-sm font-mono font-medium text-[#00ff00]/70 animate-text-glow">
              {title} — matrix — 80×24
            </span>
          </div>
        </div>

        {/* Terminal content */}
        <div className="relative p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

interface TerminalBlockProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function TerminalBlock({ title, children, className = '' }: TerminalBlockProps) {
  return (
    <div className={`relative overflow-hidden rounded-md border border-[#00ff00]/20 bg-black/30 backdrop-blur-sm ${className}`}>
      <div className="border-b border-[#00ff00]/20 bg-black/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-[#00ff00] shadow-[0_0_10px_#00ff00]" />
          <h3 className="text-sm font-mono font-medium text-[#00ff00]/90 animate-text-glow">{title}</h3>
        </div>
      </div>
      <div className="p-4 text-sm matrix-text">
        {children}
      </div>
    </div>
  );
} 
