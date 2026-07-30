import React, { useState, useRef, useEffect } from 'react';
import { Phone, PhoneOff, Mic, Loader2 } from 'lucide-react';
import { speakText, stopSpeaking } from '../lib/audio';

interface TranscriptEntry {
  id: string;
  sender: 'assistant' | 'customer';
  text: string;
}

export const LandingPage: React.FC = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const isCallActiveRef = useRef(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'assistant_speaking' | 'listening' | 'processing'>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const handleStartCall = async () => {
    setIsCallActive(true);
    isCallActiveRef.current = true;
    setCallStatus('connecting');
    setTranscript([]);

    try {
      const res = await fetch('/api/voice/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '0170 11122233', // Default landing page demo user
          isFirstGreeting: true,
          history: []
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setTranscript([{ id: 't-' + Date.now(), sender: 'assistant', text: data.text }]);
        setCallStatus('assistant_speaking');
        speakText(data.text, 'de-DE-Journey-F', () => {
          if (isCallActiveRef.current) startListening();
        });
      }
    } catch (err) {
      console.error(err);
      handleEndCall();
    }
  };

  const handleEndCall = () => {
    stopSpeaking();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsCallActive(false);
    isCallActiveRef.current = false;
    setCallStatus('idle');
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Browser does not support SpeechRecognition.");
      setCallStatus('idle'); // Fallback state if no mic
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setCallStatus('listening');
    
    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      if (spokenText) handleSendMessage(spokenText);
    };

    recognition.onerror = () => setCallStatus('idle');
    recognition.onend = () => {
      // If we are still supposed to be listening but it ended, it might have timed out
      setCallStatus(prev => prev === 'listening' ? 'idle' : prev);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSendMessage = async (text: string) => {
    stopSpeaking();
    setCallStatus('processing');
    
    const userEntry: TranscriptEntry = { id: 'u-' + Date.now(), sender: 'customer', text };
    const currentHistory = [...transcript, userEntry];
    setTranscript(currentHistory);

    try {
      const res = await fetch('/api/voice/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '0170 11122233',
          userMessage: text,
          history: currentHistory
        })
      });
      const data = await res.json();

      if (data.success) {
        setTranscript(prev => [...prev, { id: 'a-' + Date.now(), sender: 'assistant', text: data.text }]);
        
        // If AI says Farewell, end call
        if (data.text.includes('Auf Wiederhören')) {
          setCallStatus('assistant_speaking');
          speakText(data.text, 'de-DE-Journey-F', () => {
            if (isCallActiveRef.current) handleEndCall();
          });
        } else {
          setCallStatus('assistant_speaking');
          speakText(data.text, 'de-DE-Journey-F', () => {
            // Auto start listening again after assistant finishes
            if (isCallActiveRef.current) startListening();
          });
        }
      }
    } catch (err) {
      console.error(err);
      setCallStatus('idle');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans relative">
      
      {/* Top Navigation / Indicator */}
      <div className="absolute top-12 w-full flex items-center justify-center px-4">
        <div className="flex items-center space-x-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isCallActive ? 'bg-blue-500 animate-pulse' : 'bg-[#00D084]'}`}></div>
          <span className="text-sm font-semibold text-slate-800">Lisa - Ihr KI Assistent</span>
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-6">
        
        {!isCallActive ? (
          <>
            <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-10">
              Sprachassistentin
            </p>

            <style>{`
              @keyframes callPulse {
                0% { transform: scale(1.45); opacity: 0.6; }
                50% { transform: scale(1.85); opacity: 0.15; }
                100% { transform: scale(1.45); opacity: 0.6; }
              }
              .group:hover .hover-pulse-ring {
                animation: callPulse 2.5s ease-in-out infinite;
                opacity: 1; /* override tailwind opacity-0 */
              }
            `}</style>

            <button 
              onClick={handleStartCall}
              className="relative group flex flex-col items-center focus:outline-none"
            >
              <div className="absolute inset-0 top-0 bg-[#E8F0FE] rounded-full opacity-0 hover-pulse-ring transition-opacity duration-300 -z-20"></div>
              <div className="absolute inset-0 top-0 bg-[#E8F0FE] rounded-full scale-[1.35] transition-transform duration-300 ease-out group-hover:scale-[1.45] -z-10"></div>
              <div className="relative w-20 h-20 bg-[#1A73E8] rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:bg-[#1557B0] transition-colors duration-300">
                <Phone className="w-8 h-8" strokeWidth={2.5} />
              </div>
              <span className="mt-14 text-[15px] font-semibold text-slate-600 group-hover:text-[#1A73E8] transition-colors">
                Anruf starten
              </span>
            </button>

            <p className="mt-4 text-xs text-slate-400 font-medium">
              Lisa ist rund um die Uhr für Sie erreichbar
            </p>
          </>
        ) : (
          <div className="w-full flex flex-col h-[60vh] mt-10">
            {/* Active Call UI */}
            <div className="flex flex-col items-center mb-8">
              <button 
                onClick={handleEndCall}
                className="relative group flex flex-col items-center focus:outline-none"
              >
                <div className="absolute inset-0 top-0 bg-red-100 rounded-full scale-[1.35] animate-pulse -z-10"></div>
                <div className="relative w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors duration-300">
                  <PhoneOff className="w-6 h-6" strokeWidth={2.5} />
                </div>
              </button>
              
              <div className="mt-10 h-6 flex items-center justify-center text-xs font-semibold uppercase tracking-widest">
                {callStatus === 'connecting' && <span className="text-slate-400 flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-2"/> Verbindet...</span>}
                {callStatus === 'assistant_speaking' && <span className="text-blue-500">Lisa spricht...</span>}
                {callStatus === 'listening' && <span className="text-emerald-500 flex items-center"><Mic className="w-3 h-3 mr-2 animate-pulse"/> Hört zu...</span>}
                {callStatus === 'processing' && <span className="text-indigo-400 flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-2"/> Verarbeitet...</span>}
                {callStatus === 'idle' && <span className="text-slate-400">Pausiert</span>}
              </div>
            </div>

            {/* Transcript */}
            <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-4">
              {transcript.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'assistant' 
                      ? 'bg-[#F1F3F4] text-slate-800 rounded-tl-sm' 
                      : 'bg-[#1A73E8] text-white rounded-tr-sm shadow-md shadow-blue-500/10'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
            
            {/* Manual input fallback if mic doesn't trigger or fails */}
            <div className="mt-4 px-4 flex items-center space-x-2">
               <button 
                 onClick={() => {
                   if (callStatus === 'listening') {
                     if (recognitionRef.current) recognitionRef.current.stop();
                     setCallStatus('idle');
                   } else {
                     startListening();
                   }
                 }}
                 className={`p-3 rounded-xl border flex-shrink-0 transition-colors ${
                   callStatus === 'listening' 
                     ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' 
                     : 'bg-[#F8F9FA] text-slate-400 border-slate-200 hover:text-[#1A73E8] hover:border-[#1A73E8]'
                 }`}
                 title={callStatus === 'listening' ? 'Mikrofon stoppen' : 'Mikrofon aktivieren'}
               >
                 {callStatus === 'listening' ? <Mic className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
               </button>
               <input 
                 type="text" 
                 placeholder="Tippen Sie Ihre Antwort..." 
                 className="flex-1 bg-[#F8F9FA] border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                     handleSendMessage(e.currentTarget.value.trim());
                     e.currentTarget.value = '';
                   }
                 }}
               />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
