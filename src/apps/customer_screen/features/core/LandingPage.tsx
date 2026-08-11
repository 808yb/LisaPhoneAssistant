import React, { useState, useRef, useEffect } from 'react';
import { Phone, PhoneOff, Mic, Loader2 } from 'lucide-react';
import { speakText, stopSpeaking } from '../calls/audio';

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
              className="relative group flex flex-col items-center focus:outline-none mb-10"
            >
              <div className="absolute inset-0 top-0 bg-[#E8F0FE] rounded-full opacity-0 hover-pulse-ring transition-opacity duration-300 -z-20"></div>
              <div className="absolute inset-0 top-0 bg-[#E8F0FE] rounded-full scale-[1.35] transition-transform duration-300 ease-out group-hover:scale-[1.45] -z-10"></div>
              <div className="relative w-20 h-20 bg-[#1A73E8] rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:bg-[#1557B0] transition-colors duration-300">
                <Phone className="w-8 h-8" strokeWidth={2.5} />
              </div>
              <span className="mt-14 text-[15px] font-semibold text-slate-600 group-hover:text-[#1A73E8] transition-colors">
                Anruf im Browser starten
              </span>
            </button>

            {/* Neues Feld für echten Anruf */}
            <div className="w-full max-w-sm flex flex-col items-center border-t border-slate-100 pt-8">
              <p className="text-[13px] font-semibold text-slate-600 mb-4">Oder lassen Sie sich auf dem Handy anrufen:</p>
              <div className="flex w-full flex-col sm:flex-row gap-2">
                
                {/* Custom Dropdown to bypass Windows emoji limitations */}
                <div className="relative group">
                  <div className="flex h-full items-center rounded-xl border border-slate-200 bg-[#F8F9FA] px-3 py-3 cursor-pointer hover:border-[#1A73E8] transition-colors">
                    <img id="selectedFlag" src="https://flagcdn.com/w20/de.png" alt="DE" className="w-5 h-auto mr-2 rounded-sm" />
                    <span id="selectedCodeText" className="text-sm text-slate-600 font-medium">+49</span>
                    <input type="hidden" id="countryCodeInput" value="+49" />
                  </div>
                  
                  {/* Dropdown Menu (hidden by default, shown on hover/focus within group) */}
                  <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-slate-100 shadow-xl rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    {[
                      { code: '+49', country: 'de', label: 'DE (+49)' },
                      { code: '+43', country: 'at', label: 'AT (+43)' },
                      { code: '+41', country: 'ch', label: 'CH (+41)' },
                      { code: '+1', country: 'us', label: 'US (+1)' },
                      { code: '+44', country: 'gb', label: 'GB (+44)' }
                    ].map(c => (
                      <div 
                        key={c.code}
                        className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer"
                        onClick={() => {
                          (document.getElementById('countryCodeInput') as HTMLInputElement).value = c.code;
                          (document.getElementById('selectedCodeText') as HTMLSpanElement).innerText = c.code;
                          (document.getElementById('selectedFlag') as HTMLImageElement).src = `https://flagcdn.com/w20/${c.country}.png`;
                          // Close dropdown hack by removing focus
                          (document.activeElement as HTMLElement)?.blur();
                        }}
                      >
                        <img src={`https://flagcdn.com/w20/${c.country}.png`} alt={c.country} className="w-5 h-auto mr-3 rounded-sm shadow-sm" />
                        <span className="text-sm text-slate-700">{c.code}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-1 rounded-xl border border-slate-200 bg-[#F8F9FA] overflow-hidden focus-within:border-[#1A73E8] focus-within:ring-1 focus-within:ring-[#1A73E8] transition-all">
                  <input 
                    type="text" 
                    id="landingPhoneInput"
                    placeholder="151 1234567" 
                    className="flex-1 bg-transparent border-none px-4 py-3 text-sm focus:outline-none"
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                    }}
                  />
                </div>
                
                <button 
                  onClick={async () => {
                    const country = (document.getElementById('countryCodeInput') as HTMLInputElement).value;
                    let phoneInput = (document.getElementById('landingPhoneInput') as HTMLInputElement).value;
                    
                    if (!phoneInput) return alert("Bitte Nummer eingeben!");
                    
                    // Führende Nullen entfernen (z.B. aus 0176 wird 176) und Leerzeichen löschen
                    phoneInput = phoneInput.replace(/^0+/, '').replace(/[\s-]/g, '');
                    const fullPhone = country + phoneInput;

                    let publicUrl = window.location.origin;
                    // Nur lokal nach Ngrok fragen
                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                      const manualUrl = prompt("Lokaler Test: Bitte Ngrok URL eingeben (z.B. https://1234.ngrok-free.app):", "");
                      if (!manualUrl) return;
                      publicUrl = manualUrl;
                    }

                    try {
                      const res = await fetch('/api/twilio/call', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          toPhone: fullPhone,
                          ngrokUrl: publicUrl.replace(/\/$/, '')
                        })
                      });
                      const data = await res.json();
                      if (data.success) {
                        alert("Lisa ruft Sie jetzt an auf: " + fullPhone);
                      } else {
                        alert("Fehler: " + data.error);
                      }
                    } catch(e: any) {
                      alert("Netzwerkfehler: " + e.message);
                    }
                  }}
                  className="bg-[#1A73E8] text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-[#1557B0] transition-colors whitespace-nowrap shadow-md shadow-blue-500/20"
                >
                  Lass Lisa Sie anrufen
                </button>
              </div>
              <p className="mt-4 text-xs text-slate-400 font-medium text-center">
                Lisa ist rund um die Uhr für Sie erreichbar
              </p>
            </div>
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
