import React, { useState } from 'react';
import { Lightbulb, Fan, Lock, Power, Thermometer } from 'lucide-react';
import { Card } from './ui/Card';
import { Device } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface DeviceControlProps {
  devices: Device[];
  onToggle: (id: string) => void;
  onValueChange: (id: string, value: number) => void;
}

export function DeviceControl({ devices, onToggle, onValueChange }: DeviceControlProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {devices.map((device) => (
        <DeviceCard 
          key={device.id} 
          device={device} 
          onToggle={() => onToggle(device.id)}
          onValueChange={(val) => onValueChange(device.id, val)}
        />
      ))}
    </div>
  );
}

function DeviceCard({ device, onToggle, onValueChange }: { device: Device; onToggle: () => void; onValueChange: (val: number) => void }) {
  const Icon = getIcon(device.type);
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className={cn(
        "cursor-pointer transition-colors duration-300",
        device.isOn ? "border-cyber-primary/50 bg-cyber-primary/5" : "border-cyber-border bg-cyber-card/50"
      )}>
        <div className="flex justify-between items-start mb-4">
          <div className={cn(
            "p-3 rounded-full transition-colors duration-300",
            device.isOn ? "bg-cyber-primary/20 text-cyber-primary neon-text" : "bg-gray-800 text-gray-500"
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
              device.isOn ? "bg-cyber-success text-black shadow-[0_0_10px_rgba(0,255,157,0.5)]" : "bg-gray-800 text-gray-500 hover:bg-gray-700"
            )}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-lg text-white">{device.name}</h3>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">{device.room}</p>
        </div>

        {/* Controls based on type */}
        {device.type === 'light' && device.isOn && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Brightness</span>
              <span>{device.value}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={device.value || 0} 
              onChange={(e) => onValueChange(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyber-primary"
            />
          </div>
        )}

        {device.type === 'ac' && device.isOn && (
          <div className="mt-4 flex items-center justify-between bg-black/20 p-2 rounded border border-white/5">
            <button 
              onClick={(e) => { e.stopPropagation(); onValueChange((device.value || 24) - 1); }}
              className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded hover:bg-gray-700 text-white"
            >
              -
            </button>
            <span className="text-xl font-mono font-bold text-cyber-primary neon-text">
              {device.value}°C
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); onValueChange((device.value || 24) + 1); }}
              className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded hover:bg-gray-700 text-white"
            >
              +
            </button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function getIcon(type: Device['type']) {
  switch (type) {
    case 'light': return Lightbulb;
    case 'ac': return Thermometer; // Or Snowflake if available, but Thermometer is safer
    case 'fan': return Fan;
    case 'lock': return Lock;
    case 'outlet': return Power;
    default: return Power;
  }
}
