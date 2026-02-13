import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FridayCore } from './components/FridayCore';
import { InfoPanel } from './components/InfoPanel';
import { ChatHistory } from './components/ChatHistory';
import { generateResponse } from './services/geminiService';
import { AssistantState, Message } from './types';
import { Mic, MicOff, Terminal, Volume2, Power, Wifi, WifiOff } from 'lucide-react';

export const App: React.FC = () => {
  const [state, setState] = useState<AssistantState>(AssistantState.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState('');
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isSystemActive, setIsSystemActive] = useState(false); // Master switch for the assistant
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Refs to access latest state inside event listeners without re-binding
  const stateRef = useRef(AssistantState.IDLE);
  const transcriptRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const isSystemActiveRef = useRef(false);

  // Keep refs synced with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    isSystemActiveRef.current = isSystemActive;
    if (isSystemActive) {
      startListening();
    } else {
      stopListening();
    }
  }, [isSystemActive]);

  // Network Status Monitor
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const stopListening = () => {
    if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
    }
    setState(AssistantState.IDLE);
  };

  const startListening = () => {
      // Don't start if already speaking or processing
      if (stateRef.current === AssistantState.SPEAKING || stateRef.current === AssistantState.PROCESSING) return;

      if (recognitionRef.current) {
          try {
             recognitionRef.current.start();
          } catch(e: any) {
             // Ignore 'already started' errors, they are harmless
             // Real errors will be caught by onerror
          }
      }
  };

  // Handle Voice Output
  const speak = useCallback((text: string) => {
    if (synthesisRef.current.speaking) {
      synthesisRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthesisRef.current.getVoices();

    // Priority for Cuteness/Realism:
    // 1. Google Hindi (Best for Hinglish)
    // 2. Microsoft Swara (Windows Hindi)
    // 3. Google US English (Soft female)
    // 4. Any Hindi Female
    
    let selectedVoice = voices.find(v => 
      v.name.includes('Google हिन्दी') || 
      v.name.includes('Google Hindi')
    );

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.name.includes('Microsoft Swara'));
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.name.includes('Google US English'));
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        (v.lang.includes('hi') || v.lang.includes('HI')) && v.name.includes('Female')
      );
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      if (selectedVoice.lang.includes('hi') || selectedVoice.name.includes('Hindi') || selectedVoice.name.includes('Swara')) {
        utterance.lang = 'hi-IN';
      }
    }

    // Adjustments for "Cute & Sweet" tone
    utterance.pitch = 1.2; // Higher pitch = younger/sweeter
    utterance.rate = 1.05; // Slightly faster = energetic/efficient
    utterance.volume = 1;
    
    utterance.onstart = () => {
        setState(AssistantState.SPEAKING);
        // Abort recognition while speaking to prevent hearing itself
        try { recognitionRef.current?.abort(); } catch(e) {}
    };

    utterance.onend = () => {
        setState(AssistantState.IDLE);
        // Resume listening after speaking if system is active
        if (isSystemActiveRef.current) {
            // Small delay to ensure state update propagates
            setTimeout(() => startListening(), 100); 
        }
    };
    
    synthesisRef.current.speak(utterance);
  }, []);

  const addMessage = useCallback((text: string, sender: 'user' | 'friday') => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    }]);
  }, []);

  // Process Command Logic
  const processCommand = useCallback(async (text: string): Promise<boolean> => {
    const lowerText = text.toLowerCase();
    
    // Wake Word Detection Logic
    const wakeWord = 'friday';
    const hasWakeWord = lowerText.includes(wakeWord);

    if (!hasWakeWord) {
       return false; 
    }

    setState(AssistantState.PROCESSING);
    
    // Clean command: remove "friday"
    const command = lowerText.replace(wakeWord, '').trim();

    addMessage(text, 'user');

    if (!command) {
        // User just said "Friday"
        const response = "Ji Sir?";
        addMessage(response, 'friday');
        speak(response);
        return true;
    }

    let responseText = "";

    // --- COMMAND EXECUTION LOGIC ---

    // 1. VS Code (Protocol Handler)
    if (command.includes('open vs code') || command.includes('visual studio code') || command.includes('open code')) {
      window.location.href = 'vscode://';
      responseText = "Opening Visual Studio Code, Sir.";
    
    // 2. New Tab
    } else if (command.includes('open new tab')) {
      window.open('https://google.com', '_blank');
      responseText = "New tab open kar diya hai Sir.";

    // 3. Spotify (Protocol Handler)
    } else if (command.includes('open spotify') || command.includes('play music')) {
      window.location.href = 'spotify:';
      responseText = "Opening Spotify Sir, enjoy the music!";

    // 4. Windows Settings (Protocol Handler)
    } else if (command.includes('open settings') || command.includes('system settings')) {
      window.location.href = 'ms-settings:';
      responseText = "Opening System Settings.";

    // 5. Google
    } else if (command.includes('open google')) {
      window.open('https://google.com', '_blank');
      responseText = "Ji Sir, Google open kar rahi hoon.";
    
    // 6. YouTube
    } else if (command.includes('open youtube')) {
      window.open('https://youtube.com', '_blank');
      responseText = "Youtube start kar diya, Sir.";

    // 7. GitHub
    } else if (command.includes('open github')) {
      window.open('https://github.com', '_blank');
      responseText = "GitHub opening now. Happy coding!";

    // 8. Stack Overflow
    } else if (command.includes('open stack overflow')) {
      window.open('https://stackoverflow.com', '_blank');
      responseText = "Opening Stack Overflow.";

    // 9. Time
    } else if (command.includes('time') || command.includes('samay')) {
      responseText = `Sir, abhi ${new Date().toLocaleTimeString()} baj rahe hain.`;
    
    // 10. Date
    } else if (command.includes('date') || command.includes('tareekh')) {
      responseText = `Aaj ki tareekh hai ${new Date().toLocaleDateString()}, Sir.`;
    
    // 11. Hardware Control (Simulated)
    } else if (command.includes('shutdown') || command.includes('restart')) {
      responseText = "Hardware access browser se allowed nahi hai Sir, sorry!";
    
    // 12. Identity (Local - Offline friendly)
    } else if (command.includes('who are you') || command.includes('tum kaun ho') || command.includes('introduction')) {
      responseText = "Main FRIDAY hoon Sir. Aapki personal assistant. Offline bhi kaam kar sakti hoon!";

    // 13. Capabilities (Local - Offline friendly)
    } else if (command.includes('what can you do') || command.includes('kya kar sakti ho')) {
      responseText = "Main apps open kar sakti hoon, time bata sakti hoon, aur hum baatein bhi kar sakte hain!";

    // 14. Greetings (Local - Offline friendly)
    } else if (command === 'hello' || command === 'hi' || command === 'hey' || command === 'namaste') {
      responseText = "Hello Sir! Kya haal hai?";

    // 15. Fallback to AI
    } else {
      if (!navigator.onLine) {
         responseText = "Sir, abhi internet disconnected hai. Main sirf offline commands sun sakti hoon.";
      } else {
         try {
            // AI Processing
            responseText = await generateResponse(command);
         } catch (e) {
            responseText = "Connection error Sir. Please check internet.";
         }
      }
    }

    addMessage(responseText, 'friday');
    speak(responseText);
    return true;
  }, [addMessage, speak]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false; 
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Recognizing Indian English/Hindi accents
      
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        
        // Wake Word Visual Trigger
        if (currentTranscript.toLowerCase().includes('friday')) {
             if (stateRef.current !== AssistantState.LISTENING) {
                 setState(AssistantState.LISTENING);
             }
        }

        setTranscript(currentTranscript);
      };

      recognition.onend = async () => {
        const currentTranscript = transcriptRef.current;
        
        // If we have a result, process it
        if (currentTranscript && currentTranscript.trim().length > 0) {
             const handled = await processCommand(currentTranscript);
             setTranscript('');
             
             // If command was ignored (no wake word), restart listening
             if (!handled) {
                if (isSystemActiveRef.current && stateRef.current !== AssistantState.SPEAKING) {
                    startListening();
                }
             }
        } else {
             // If silence/no result, restart
             // "no-speech" errors from onerror will eventually lead here with empty transcript
             if (isSystemActiveRef.current && stateRef.current !== AssistantState.SPEAKING && stateRef.current !== AssistantState.PROCESSING) {
                 startListening();
             } else {
                 // Only set IDLE if we are not intending to restart/speak
                 if (!isSystemActiveRef.current) {
                    setState(AssistantState.IDLE);
                 }
             }
        }
      };
      
      recognition.onerror = (event: any) => {
        // Ignore "no-speech" (normal silence) and "aborted" (manual stop)
        // 'no-speech' will trigger onend, which handles the restart logic
        if (event.error === 'aborted' || event.error === 'no-speech') return;

        if (event.error === 'network') {
           console.warn("Speech recognition network error - Retrying...");
        } else {
           console.error("Speech recognition error:", event.error);
        }

        if (event.error === 'not-allowed') {
            setIsPermissionGranted(false);
            setIsSystemActive(false);
        }
        
        // Restart loop for other meaningful errors if active
        if (isSystemActiveRef.current && event.error !== 'not-allowed') {
             // Use a longer backoff for network errors to prevent spam
             const delay = event.error === 'network' ? 2000 : 500;
             setTimeout(() => {
                startListening();
             }, delay);
        }
      };

      recognitionRef.current = recognition;
      setIsPermissionGranted(true);
    } else {
      alert("Your browser does not support voice recognition. Please use Chrome.");
    }

    return () => {
      stopListening();
    };
  }, [processCommand]);

  const toggleSystem = () => {
      const newState = !isSystemActive;
      setIsSystemActive(newState);
      if (newState) {
          speak("System Online. Main ready hoon Sir.");
      } else {
          speak("Bye bye Sir.");
      }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center">
      
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/80 to-black pointer-events-none"></div>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-[0.2em] text-cyan-500 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
            FRIDAY
          </h1>
          <span className="text-xs text-cyan-800 tracking-widest uppercase">
              {isSystemActive ? "System Online • Listening" : "System Standby"}
          </span>
        </div>
        
        <div className="flex flex-col items-end gap-2">
           {!isPermissionGranted && (
             <div className="text-red-500 font-bold animate-pulse text-xs">MIC PERMISSION REQUIRED</div>
           )}
           <div className={`flex items-center gap-2 text-xs ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? 'ONLINE' : 'OFFLINE'}
           </div>
        </div>
      </div>

      <InfoPanel />

      {/* Main Visualizer */}
      <div className="z-20 transform -translate-y-12">
        <FridayCore state={state} />
      </div>

      {/* Transcript / Input Feedback */}
      <div className="absolute bottom-48 text-center px-4 max-w-3xl min-h-[3rem]">
         {(state === AssistantState.LISTENING || transcript) && (
           <p className="text-2xl text-cyan-100 font-light tracking-wide animate-pulse">
             {transcript || (state === AssistantState.LISTENING ? "Listening..." : "")}
           </p>
         )}
      </div>

      <ChatHistory messages={messages} />

      {/* Controls */}
      <div className="absolute bottom-8 z-30 flex gap-4">
        <button
          onClick={toggleSystem}
          className={`p-4 rounded-full border transition-all duration-300 group ${
            isSystemActive 
              ? 'bg-cyan-900/20 border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(8,145,178,0.4)]' 
              : 'bg-gray-900/50 border-gray-600 text-gray-500 hover:border-gray-400'
          }`}
        >
          {isSystemActive ? <Power className="w-6 h-6 shadow-cyan-500" /> : <Power className="w-6 h-6" />}
        </button>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-8 left-8 w-32 h-32 border-l-2 border-t-2 border-cyan-800/30 rounded-tl-3xl pointer-events-none"></div>
      <div className="absolute top-8 right-8 w-32 h-32 border-r-2 border-t-2 border-cyan-800/30 rounded-tr-3xl pointer-events-none"></div>
      <div className="absolute bottom-8 left-8 w-32 h-32 border-l-2 border-b-2 border-cyan-800/30 rounded-bl-3xl pointer-events-none"></div>
      <div className="absolute bottom-8 right-8 w-32 h-32 border-r-2 border-b-2 border-cyan-800/30 rounded-br-3xl pointer-events-none"></div>

      {/* Terminal Aesthetic Lines */}
      <div className="absolute bottom-10 left-10 flex items-center gap-2 opacity-50">
          <Terminal className="w-4 h-4 text-cyan-600" />
          <div className="h-px w-24 bg-cyan-800"></div>
      </div>
       <div className="absolute bottom-10 right-10 flex items-center gap-2 opacity-50">
          <div className="h-px w-24 bg-cyan-800"></div>
          <Volume2 className="w-4 h-4 text-cyan-600" />
      </div>

    </div>
  );
};