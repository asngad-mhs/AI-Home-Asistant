import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function Card({ className, title, action, children, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "glass-panel rounded-xl p-6 relative overflow-hidden group transition-all duration-300 hover:border-cyber-primary/50",
        className
      )} 
      {...props}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyber-primary opacity-50 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyber-primary opacity-50 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyber-primary opacity-50 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyber-primary opacity-50 group-hover:opacity-100 transition-opacity" />

      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-cyber-primary neon-text">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
