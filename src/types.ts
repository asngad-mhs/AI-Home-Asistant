export interface Device {
  id: string;
  name: string;
  type: 'light' | 'ac' | 'lock' | 'fan' | 'outlet';
  room: string;
  isOn: boolean;
  value?: number; // Brightness, temperature, etc.
  unit?: string;
}

export interface EnergyStats {
  currentUsage: number; // kW
  dailyTotal: number; // kWh
  solarGeneration: number; // kW
  batteryLevel: number; // %
  gridStatus: 'connected' | 'disconnected';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
