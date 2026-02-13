import React from 'react';
import { AssistantState } from '../types';

interface FridayCoreProps {
  state: AssistantState;
  volume?: number; // Simulated volume for visualization
}

export const FridayCore: React.FC<FridayCoreProps> = ({ state }) => {
  // Determine color and animation based on state
  const getCoreStyles = () => {
    switch (state) {
      case AssistantState.LISTENING:
        return 'border-red-500 shadow-[0_0_60px_#ef4444] scale-110';
      case AssistantState.PROCESSING:
        return 'border-yellow-400 shadow-[0_0_60px_#facc15] animate-spin';
      case AssistantState.SPEAKING:
        return 'border-cyan-400 shadow-[0_0_80px_#22d3ee] animate-pulse scale-105';
      case AssistantState.IDLE:
      default:
        return 'border-cyan-600 shadow-[0_0_30px_#0891b2]';
    }
  };

  const getInnerStyles = () => {
     switch (state) {
      case AssistantState.LISTENING:
        return 'bg-red-500/20';
      case AssistantState.PROCESSING:
        return 'bg-yellow-400/20';
      case AssistantState.SPEAKING:
        return 'bg-cyan-400/30';
      case AssistantState.IDLE:
      default:
        return 'bg-cyan-900/20';
    }
  };

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer Rings */}
      <div className={`absolute w-full h-full border-2 rounded-full opacity-50 transition-all duration-500 ${state === AssistantState.SPEAKING ? 'scale-125 border-cyan-400 opacity-20' : 'border-cyan-800'}`}></div>
      <div className={`absolute w-[90%] h-[90%] border border-dashed rounded-full animate-[spin_10s_linear_infinite] opacity-40 transition-colors duration-300 ${state === AssistantState.LISTENING ? 'border-red-500' : 'border-cyan-500'}`}></div>
      
      {/* Main Core */}
      <div className={`relative w-48 h-48 border-4 rounded-full flex items-center justify-center transition-all duration-300 ${getCoreStyles()}`}>
        <div className={`w-40 h-40 rounded-full backdrop-blur-sm transition-all duration-300 ${getInnerStyles()}`}>
             {/* Inner detail lines */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
             <div className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>
      </div>
      
      {/* Status Text */}
      <div className="absolute -bottom-12 font-bold tracking-[0.2em] text-cyan-200 text-sm uppercase">
        {state}
      </div>
    </div>
  );
};
