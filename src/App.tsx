/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { EnergyMonitor } from '@/components/EnergyMonitor';
import { DeviceControl } from '@/components/DeviceControl';
import { AIChat } from '@/components/AIChat';
import { Device, EnergyStats, ChatMessage } from '@/types';
import { Activity, Home, Settings, Zap, User } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

// Initial Mock Data
const INITIAL_DEVICES: Device[] = [
  { id: 'light-1', name: 'Lampu Ruang Tamu', type: 'light', room: 'Ruang Tamu', isOn: true, value: 80 },
  { id: 'ac-1', name: 'AC Utama', type: 'ac', room: 'Kamar Tidur', isOn: true, value: 24 },
  { id: 'fan-1', name: 'Kipas Angin', type: 'fan', room: 'Ruang Tamu', isOn: false, value: 0 },
  { id: 'lock-1', name: 'Pintu Depan', type: 'lock', room: 'Pintu Masuk', isOn: true }, // isOn = Terkunci
  { id: 'light-2', name: 'Lampu Dapur', type: 'light', room: 'Dapur', isOn: false, value: 0 },
  { id: 'outlet-1', name: 'Mesin Kopi', type: 'outlet', room: 'Dapur', isOn: false },
];

const INITIAL_STATS: EnergyStats = {
  currentUsage: 4.2,
  dailyTotal: 12.5,
  solarGeneration: 3.8,
  batteryLevel: 85,
  gridStatus: 'connected',
};

export default function App() {
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [stats, setStats] = useState<EnergyStats>(INITIAL_STATS);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: 'Sistem diinisialisasi. Asisten Rumah AI siap. Ada yang bisa saya bantu untuk mengelola rumah Anda hari ini?', timestamp: Date.now() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSystemOnline, setIsSystemOnline] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');
  const [userApiKey, setUserApiKey] = useState('');

  // Gemini Client
  const aiRef = useRef<GoogleGenAI | null>(null);

  // HARDCODED FALLBACK KEY (Provided by user)
  // WARNING: In a real production app, never hardcode API keys in client-side code.
  // Always use environment variables or a backend proxy.
  const FALLBACK_API_KEY = "AIzaSyBstkmCN6WHprz0KCUvIYw-LW0u6r0ruCg";

  // Initialize AI Client
  useEffect(() => {
    const initAI = (key: string) => {
      try {
        console.log("Initializing AI with key:", key ? "Present" : "Missing");
        aiRef.current = new GoogleGenAI({ apiKey: key });
        setIsSystemOnline(true);
        // Only add success message if it was previously offline/missing
        if (!isSystemOnline) {
          setMessages(prev => [...prev, {
            id: 'system-online',
            role: 'assistant',
            content: "Sistem Online. Koneksi ke Gemini AI berhasil dipulihkan.",
            timestamp: Date.now()
          }]);
        }
      } catch (e) {
        console.error("Failed to initialize Gemini client:", e);
        setIsSystemOnline(false);
      }
    };

    // 1. Check Environment Variable
    const envKey = process.env.GEMINI_API_KEY;
    
    // 2. Check Local Storage
    const storedKey = localStorage.getItem('gemini_api_key');

    if (envKey) {
      initAI(envKey);
    } else if (storedKey) {
      setUserApiKey(storedKey);
      initAI(storedKey);
    } else {
      // 3. Use Fallback Key
      console.warn("Using fallback API key");
      initAI(FALLBACK_API_KEY);
      // Optional: Auto-save to local storage so it persists in settings UI
      setUserApiKey(FALLBACK_API_KEY);
    }
  }, []);

  const handleSaveKey = (key: string) => {
    setUserApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    if (key) {
      try {
        aiRef.current = new GoogleGenAI({ apiKey: key });
        setIsSystemOnline(true);
        setMessages(prev => [...prev, {
          id: 'key-updated',
          role: 'assistant',
          content: "Kunci API diperbarui. Sistem Online.",
          timestamp: Date.now()
        }]);
        setCurrentView('dashboard');
      } catch (e) {
        alert("Kunci API tidak valid");
      }
    }
  };

  // --- Device Actions ---
  const toggleDevice = (id: string) => {
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, isOn: !d.isOn };
      }
      return d;
    }));
  };

  const setDeviceValue = (id: string, value: number) => {
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, value };
      }
      return d;
    }));
  };

  // --- AI Tools Definition ---
  const tools = [{
    functionDeclarations: [
      {
        name: "toggleDevice",
        description: "Menyalakan atau mematikan perangkat.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            deviceId: { type: Type.STRING, description: "ID perangkat yang akan diubah. Simpulkan dari konteks atau tanyakan pengguna." },
            state: { type: Type.BOOLEAN, description: "True untuk NYALA/TERKUNCI, False untuk MATI/TERBUKA." }
          },
          required: ["deviceId", "state"]
        }
      },
      {
        name: "setDeviceValue",
        description: "Mengatur nilai untuk perangkat (misalnya, kecerahan, suhu).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            deviceId: { type: Type.STRING, description: "ID perangkat." },
            value: { type: Type.NUMBER, description: "Nilai yang akan diatur." }
          },
          required: ["deviceId", "value"]
        }
      },
      {
        name: "getHomeStatus",
        description: "Mendapatkan status terkini dari semua perangkat dan statistik energi.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        }
      }
    ]
  }];

  // --- Simulation Logic ---
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        currentUsage: Math.max(0, prev.currentUsage + (Math.random() - 0.5) * 0.5),
        solarGeneration: Math.max(0, prev.solarGeneration + (Math.random() - 0.5) * 0.3),
        batteryLevel: Math.max(0, Math.min(100, prev.batteryLevel + (prev.solarGeneration > prev.currentUsage ? 0.1 : -0.1))),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // --- AI Logic ---
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    if (!aiRef.current) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sistem Error: Kunci API tidak terdeteksi atau inisialisasi gagal. Tidak dapat memproses pesan.",
        timestamp: Date.now()
      }]);
      return;
    }

    setIsTyping(true);

    try {
      // Create chat instance with latest context
      const chat = aiRef.current.chats.create({
        model: "gemini-2.5-flash",
        config: {
          tools: tools,
          systemInstruction: `Anda adalah Asisten Rumah AI canggih bernama Jarvis. 
          Anda mengontrol rumah pintar dengan antarmuka 'Cyberpunk/Sci-Fi'.
          Selalu membantu, ringkas, dan sedikit robotik namun sopan.
          Gunakan Bahasa Indonesia yang baik dan benar, namun tetap terdengar futuristik.
          
          Perangkat Saat Ini: ${JSON.stringify(devices.map(d => ({ id: d.id, name: d.name, room: d.room })))}
          
          Jika pengguna meminta untuk mengubah sesuatu, gunakan alat (tools) yang disediakan.
          Jika pengguna bertanya tentang status, gunakan getHomeStatus atau simpulkan dari pengetahuan Anda jika baru saja diperbarui.
          Ketika Anda mengambil tindakan, konfirmasikan secara singkat.`
        },
        history: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      });

      // Send user message
      const result = await chat.sendMessage({ message: text });
      
      // Handle function calls
      const functionCalls = result.functionCalls;
      let finalResponseText = result.text;

      if (functionCalls && functionCalls.length > 0) {
        const functionResponses = [];
        
        for (const call of functionCalls) {
          const { name, args } = call;
          let functionResponse = {};

          if (name === "toggleDevice") {
            const { deviceId, state } = args as any;
            toggleDevice(deviceId);
            functionResponse = { status: "success", message: `Perangkat ${deviceId} diubah menjadi ${state ? 'NYALA' : 'MATI'}` };
          } else if (name === "setDeviceValue") {
            const { deviceId, value } = args as any;
            setDeviceValue(deviceId, value);
            functionResponse = { status: "success", message: `Perangkat ${deviceId} diatur ke ${value}` };
          } else if (name === "getHomeStatus") {
            functionResponse = { devices, stats };
          }

          functionResponses.push({
            functionResponse: {
              name,
              response: functionResponse
            }
          });
        }

        // Send function execution results back to the model
        const finalResult = await chat.sendMessage({ message: functionResponses });
        finalResponseText = finalResult.text;
      }

      if (finalResponseText) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: finalResponseText,
          timestamp: Date.now()
        }]);
      }

    } catch (error) {
      console.error("AI Error:", error);
      
      let errorMessage = "Maaf, saya mengalami kesalahan sistem saat memproses permintaan Anda.";
      const errorStr = JSON.stringify(error) + String(error); // Capture full error details

      if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "⚠️ KUOTA HABIS: Kunci API yang digunakan telah mencapai batas penggunaan. Silakan ganti dengan Kunci API Gemini Anda sendiri di menu 'Sistem' (ikon roda gigi) untuk melanjutkan.";
      } else {
        errorMessage += " (Error: " + (error instanceof Error ? error.message : String(error)) + ")";
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-gray-200 font-sans selection:bg-cyber-primary/30">
      {/* Background Grid Effect */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1f2128_1px,transparent_1px),linear-gradient(to_bottom,#1f2128_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-col md:flex-row h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-20 lg:w-64 bg-cyber-card/80 border-r border-cyber-border flex flex-col backdrop-blur-md">
          <div className="p-6 flex items-center gap-3 border-b border-cyber-border">
            <div className="w-10 h-10 bg-cyber-primary text-black rounded-lg flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(0,240,255,0.5)]">
              AI
            </div>
            <span className="hidden lg:block font-mono font-bold text-lg tracking-wider text-white">NEXUS</span>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <NavItem 
              icon={<Home />} 
              label="Dasbor" 
              active={currentView === 'dashboard'} 
              onClick={() => setCurrentView('dashboard')}
            />
            <NavItem icon={<Activity />} label="Analitik" />
            <NavItem icon={<Zap />} label="Energi" />
            <NavItem 
              icon={<Settings />} 
              label="Sistem" 
              active={currentView === 'settings'}
              onClick={() => setCurrentView('settings')}
            />
          </nav>

          <div className="p-4 border-t border-cyber-border">
            <div className="hidden lg:flex items-center gap-3 p-3 rounded-lg bg-cyber-bg/50 border border-cyber-border">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", isSystemOnline ? "bg-cyber-success" : "bg-cyber-danger")} />
              <div className="text-xs font-mono">
                <div className="text-gray-400">STATUS</div>
                <div className={isSystemOnline ? "text-cyber-success" : "text-cyber-danger"}>
                  {isSystemOnline ? "ONLINE" : "OFFLINE"}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <header className="h-16 border-b border-cyber-border bg-cyber-card/50 backdrop-blur flex items-center justify-between px-6">
            <h1 className="text-xl font-bold tracking-wide text-white flex items-center gap-2">
              <span className="text-cyber-primary">///</span> {currentView === 'dashboard' ? 'KONTROL UTAMA' : 'PENGATURAN SISTEM'}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-gray-500">{new Date().toLocaleDateString('id-ID')}</span>
              <div className="w-8 h-8 rounded-full bg-cyber-secondary/20 border border-cyber-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-cyber-secondary" />
              </div>
            </div>
          </header>

          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            {currentView === 'dashboard' ? (
              <>
                {/* Top Row: Energy & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <EnergyMonitor stats={stats} />
                  </div>
                  <div className="hidden lg:block">
                    {/* Placeholder for mini weather or quick stats */}
                    <div className="h-full glass-panel rounded-xl p-6 flex flex-col justify-between">
                      <h3 className="text-sm font-mono font-bold uppercase text-cyber-secondary neon-text">Lingkungan</h3>
                      <div className="text-5xl font-bold text-white">24°C</div>
                      <div className="text-sm text-gray-400">Kelembaban: 45%</div>
                      <div className="text-sm text-gray-400">Kualitas Udara: Sangat Baik</div>
                    </div>
                  </div>
                </div>

                {/* Device Controls */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-cyber-primary rounded-full" />
                    MATRIKS PERANGKAT
                  </h2>
                  <DeviceControl 
                    devices={devices} 
                    onToggle={toggleDevice} 
                    onValueChange={setDeviceValue} 
                  />
                </div>
              </>
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="glass-panel rounded-xl p-8 border border-cyber-border">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Settings className="w-6 h-6 text-cyber-primary" />
                    Konfigurasi Sistem
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-mono text-gray-400 mb-2 uppercase tracking-wider">Status Koneksi AI</label>
                      <div className={cn(
                        "p-4 rounded-lg border flex items-center gap-3",
                        isSystemOnline 
                          ? "bg-cyber-success/10 border-cyber-success/30 text-cyber-success" 
                          : "bg-cyber-danger/10 border-cyber-danger/30 text-cyber-danger"
                      )}>
                        <div className={cn("w-3 h-3 rounded-full", isSystemOnline ? "bg-cyber-success" : "bg-cyber-danger")} />
                        <span className="font-mono font-bold">{isSystemOnline ? "TERHUBUNG KE GEMINI AI" : "TERPUTUS / TIDAK ADA KUNCI"}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-mono text-gray-400 mb-2 uppercase tracking-wider">Kunci API Gemini (Manual)</label>
                      <p className="text-xs text-gray-500 mb-3">
                        Jika Anda men-deploy aplikasi ini di cloud pribadi, masukkan kunci API Anda di sini. 
                        Kunci akan disimpan di browser Anda.
                      </p>
                      <div className="flex gap-2">
                        <input 
                          type="password" 
                          value={userApiKey}
                          onChange={(e) => setUserApiKey(e.target.value)}
                          placeholder="Masukkan kunci API Gemini (AIza...)"
                          className="flex-1 bg-black/50 border border-cyber-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyber-primary font-mono"
                        />
                        <button 
                          onClick={() => handleSaveKey(userApiKey)}
                          className="bg-cyber-primary text-black font-bold px-6 py-3 rounded-lg hover:bg-cyber-primary/90 transition-colors"
                        >
                          SIMPAN
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-cyber-border">
                      <h3 className="text-lg font-bold text-white mb-4">Informasi Sistem</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-gray-500">Versi</div>
                        <div className="text-right text-mono text-white">v1.0.2-cyber</div>
                        <div className="text-gray-500">Build</div>
                        <div className="text-right text-mono text-white">Production</div>
                        <div className="text-gray-500">Engine</div>
                        <div className="text-right text-mono text-white">Gemini 2.5 Flash</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Panel: Chat */}
        <aside className="w-full md:w-80 lg:w-96 border-l border-cyber-border bg-cyber-card/30 backdrop-blur-sm absolute md:relative right-0 top-0 bottom-0 z-20 transform transition-transform duration-300 translate-x-full md:translate-x-0">
           <AIChat 
             messages={messages} 
             onSendMessage={handleSendMessage} 
             isTyping={isTyping} 
           />
        </aside>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
      "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group",
      active 
        ? "bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20" 
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    )}>
      <span className={cn("transition-colors", active ? "text-cyber-primary" : "text-gray-500 group-hover:text-white")}>
        {icon}
      </span>
      <span className="hidden lg:block font-medium text-sm">{label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyber-primary shadow-[0_0_5px_rgba(0,240,255,0.8)]" />}
    </button>
  );
}
