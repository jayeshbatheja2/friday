import React, { useEffect, useState } from 'react';
import { Battery, Clock, Calendar, Cpu } from 'lucide-react';
import { BatteryManager } from '../types';

export const InfoPanel: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);

    // Battery API
    const getBatteryStatus = async () => {
      try {
        const nav = navigator as any;
        if (nav.getBattery) {
          const battery: BatteryManager = await nav.getBattery();
          setBatteryLevel(Math.floor(battery.level * 100));
          setIsCharging(battery.charging);

          battery.onlevelchange = () => setBatteryLevel(Math.floor(battery.level * 100));
          battery.onchargingchange = () => setIsCharging(battery.charging);
        }
      } catch (e) {
        console.warn("Battery API not supported");
        setBatteryLevel(100); // Fallback
      }
    };

    getBatteryStatus();

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute top-8 right-8 flex flex-col gap-4 text-cyan-400">
      
      {/* Clock */}
      <div className="flex items-center gap-3 bg-black/40 border border-cyan-800/50 p-3 rounded-lg backdrop-blur-md">
        <Clock className="w-5 h-5" />
        <span className="text-xl font-bold tracking-widest">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Date */}
      <div className="flex items-center gap-3 bg-black/40 border border-cyan-800/50 p-3 rounded-lg backdrop-blur-md">
        <Calendar className="w-5 h-5" />
        <span className="text-sm font-semibold tracking-wider uppercase">
          {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Battery */}
      <div className={`flex items-center gap-3 bg-black/40 border p-3 rounded-lg backdrop-blur-md ${isCharging ? 'border-green-500/50 text-green-400' : 'border-cyan-800/50'}`}>
        <Battery className="w-5 h-5" />
        <span className="text-sm font-bold">
          {batteryLevel !== null ? `${batteryLevel}%` : '--'}
        </span>
      </div>
      
      {/* CPU Mock */}
      <div className="flex items-center gap-3 bg-black/40 border border-cyan-800/50 p-3 rounded-lg backdrop-blur-md">
        <Cpu className="w-5 h-5 animate-pulse" />
        <span className="text-xs font-mono text-cyan-600">
          SYSTEM NORMAL
        </span>
      </div>
    </div>
  );
};
