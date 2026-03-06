import { Zap, Sun, Battery, Activity } from 'lucide-react';
import { Card } from './ui/Card';
import { motion } from 'motion/react';
import { EnergyStats } from '@/types';
import { cn } from '@/lib/utils';

interface EnergyMonitorProps {
  stats: EnergyStats;
}

export function EnergyMonitor({ stats }: EnergyMonitorProps) {
  return (
    <Card title="PLT STATUS (Power Plant)" className="h-full">
      <div className="grid grid-cols-2 gap-4">
        {/* Current Usage */}
        <div className="bg-cyber-card/50 p-4 rounded-lg border border-cyber-border">
          <div className="flex items-center gap-2 mb-2 text-cyber-danger">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-mono uppercase">Load</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats.currentUsage.toFixed(2)} <span className="text-sm text-gray-500">kW</span>
          </div>
          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-cyber-danger"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((stats.currentUsage / 5) * 100, 100)}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        {/* Solar Generation */}
        <div className="bg-cyber-card/50 p-4 rounded-lg border border-cyber-border">
          <div className="flex items-center gap-2 mb-2 text-cyber-warning">
            <Sun className="w-4 h-4" />
            <span className="text-xs font-mono uppercase">Solar</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats.solarGeneration.toFixed(2)} <span className="text-sm text-gray-500">kW</span>
          </div>
          <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-cyber-warning"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((stats.solarGeneration / 5) * 100, 100)}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        {/* Battery Level */}
        <div className="bg-cyber-card/50 p-4 rounded-lg border border-cyber-border col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-cyber-success">
              <Battery className="w-4 h-4" />
              <span className="text-xs font-mono uppercase">Battery Storage</span>
            </div>
            <span className="text-xs font-mono text-cyber-success">{stats.batteryLevel}%</span>
          </div>
          
          <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            {/* Grid lines */}
            <div className="absolute inset-0 flex justify-between px-2 z-10 opacity-20">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-px h-full bg-white" />
              ))}
            </div>
            <motion.div 
              className="h-full bg-gradient-to-r from-cyber-success/50 to-cyber-success"
              initial={{ width: 0 }}
              animate={{ width: `${stats.batteryLevel}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-mono text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        
        {/* Grid Status */}
        <div className="col-span-2 flex items-center justify-between bg-cyber-card/30 p-3 rounded border border-cyber-border">
           <div className="flex items-center gap-2">
             <Activity className="w-4 h-4 text-cyber-secondary" />
             <span className="text-xs font-mono uppercase text-gray-400">Grid Status</span>
           </div>
           <div className="flex items-center gap-2">
             <div className={cn("w-2 h-2 rounded-full animate-pulse", stats.gridStatus === 'connected' ? "bg-cyber-success" : "bg-cyber-danger")} />
             <span className={cn("text-xs font-mono font-bold", stats.gridStatus === 'connected' ? "text-cyber-success" : "text-cyber-danger")}>
               {stats.gridStatus.toUpperCase()}
             </span>
           </div>
        </div>
      </div>
    </Card>
  );
}
