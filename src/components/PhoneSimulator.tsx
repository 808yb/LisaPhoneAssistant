import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Eye, EyeOff,
  Sparkles, Bot, User, CheckCircle2, AlertCircle, RefreshCw, Send,
  Car, ShieldCheck, Zap, Info, Clock, ArrowRight, MessageSquare
} from 'lucide-react';
import { Customer, TranscriptEntry } from '../types';
import { speakText, stopSpeaking, playLocalAudio } from '../lib/audio';

interface PhoneSimulatorProps {
  customers: Customer[];
  onLeadCreated: () => void;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  customers,
  onLeadCreated
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(customers[0] || null);
  const [customPhone, setCustomPhone] = useState<string>('0151 23456789');
  const [customName, setCustomName] = useState<string>('Thomas Weber');
  
  // Real Phone Call state
  const [ngrokUrl, setNgrokUrl] = useState<string>('');
  const [isCallingRealPhone, setIsCallingRealPhone] = useState<boolean>(false);

  // Call session state
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'dialing' | 'connected' | 'assistant_speaking' | 'customer_speaking' | 'processing' | 'ended'>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [injectedContext, setInjectedContext] = useState<string>('');
  const [toolCalledToast, setToolCalledToast] = useState<{ show: boolean; data: any }>({ show: false, data: null });
  const callIdRef = useRef<number>(0);

  // Google Cloud TTS Voice state
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);

  useEffect(() => {
    // Only use the Aoede (Journey) voice as requested
    const defaultVoices = [{ voice_id: 'de-DE-Journey-F', name: 'Aoede (Journey)' }];
    setVoices(defaultVoices);
    setSelectedVoice('de-DE-Journey-F');
  }, []);

  // Audio & Input controls
  const [textInput, setTextInput] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speakerOn, setSpeakerOn] = useState<boolean>(true);
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [showSecretContext, setShowSecretContext] = useState<boolean>(true);

  // Call timer
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Speech Recognition instance
  const recognitionRef = useRef<any>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, callStatus]);

  // Update form when customer selection changes
  const handleSelectCustomer = (cust: Customer | null) => {
    if (isCallActive) return;
    setSelectedCustomer(cust);
    if (cust) {
      setCustomPhone(cust.phone);
      setCustomName(cust.name);
    } else {
      setCustomPhone('0170 98765432');
      setCustomName('Unbekannter Neukunde');
    }
  };

  // Timer logic
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Call Procedure
  const handleStartCall = async () => {
    stopSpeaking();
    setIsCallActive(true);
    setCallStatus('dialing');
    setTranscript([]);
    setInjectedContext('');
    setToolCalledToast({ show: false, data: null });

    const currentPhone = selectedCustomer ? selectedCustomer.phone : customPhone;
    const currentCallId = Date.now();
    callIdRef.current = currentCallId;

    // Simulate dialing delay
    setTimeout(async () => {
      setCallStatus('connected');
      
      // Trigger initial greeting from Gemini
      try {
        const res = await fetch('/api/voice/interact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: currentPhone,
            isFirstGreeting: true,
            history: []
          })
        });

        const data = await res.json();
        if (data.success && callIdRef.current === currentCallId) {
          setInjectedContext(data.injectedContext);

          const greetingMsg: TranscriptEntry = {
            id: 't-' + Date.now(),
            sender: 'assistant',
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };

          setTranscript([greetingMsg]);
          setCallStatus('assistant_speaking');

          if (speakerOn && !isMuted) {
            speakText(data.text, selectedVoice, () => {
              if (callIdRef.current === currentCallId) setCallStatus('connected');
            });
          } else {
            setCallStatus('connected');
          }
        }
      } catch (err) {
        console.error('Call start error:', err);
        if (callIdRef.current === currentCallId) setCallStatus('connected');
      }
    }, 1200);
  };

  // End Call Procedure
  const handleEndCall = () => {
    callIdRef.current = 0;
    stopSpeaking();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setCallStatus('ended');
    setIsCallActive(false);
    setIsMicListening(false);
  };

  // Send message to Gemini receptionist
  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || textInput;
    if (!textToSend.trim() || !isCallActive || callStatus === 'processing') return;

    stopSpeaking();
    setTextInput('');
    setCallStatus('processing');

    const userEntry: TranscriptEntry = {
      id: 't-user-' + Date.now(),
      sender: 'customer',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...transcript, userEntry];
    setTranscript(newHistory);

    try {
      const currentPhone = selectedCustomer ? selectedCustomer.phone : customPhone;
      const currentCallId = callIdRef.current;

      const res = await fetch('/api/voice/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: currentPhone,
          userMessage: textToSend,
          history: newHistory
        })
      });

      const data = await res.json();

      if (data.success && callIdRef.current === currentCallId) {
        const assistantEntry: TranscriptEntry = {
          id: 't-ai-' + Date.now(),
          sender: 'assistant',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setTranscript(prev => [...prev, assistantEntry]);

        // Check if a tool was called and handle updates or new leads
        if (data.toolCalled && data.updatedLeadData) {
          setToolCalledToast({
            show: true,
            data: { isUpdate: true, concern: data.updatedLeadData.concern }
          });
          onLeadCreated(); // Refresh leads
        } else if (data.toolCalled && data.savedLeadData) {
          setToolCalledToast({
            show: true,
            data: data.savedLeadData
          });
          onLeadCreated();
        }

        setCallStatus('assistant_speaking');
        if (speakerOn && !isMuted) {
          speakText(data.text, selectedVoice, () => {
            if (callIdRef.current === currentCallId) setCallStatus('connected');
          });
        } else {
          setCallStatus('connected');
        }
      }
    } catch (err) {
      console.error('Voice interact error:', err);
      setCallStatus('connected');
    }
  };

  const latestHandleSendMessage = useRef(handleSendMessage);
  useEffect(() => {
    latestHandleSendMessage.current = handleSendMessage;
  });

  // Toggle Browser Speech Recognition
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Ihr Browser unterstützt keine direkte Spracherkennung. Bitte nutzen Sie das Text-Eingabefeld oder die Schnell-Antworten.');
      return;
    }

    if (isMicListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsMicListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsMicListening(true);
      setCallStatus('customer_speaking');
    };

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      setIsMicListening(false);
      if (spokenText) {
        latestHandleSendMessage.current(spokenText);
      } else {
        setCallStatus('connected');
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition status:', event?.error || 'stopped');
      setIsMicListening(false);
      setCallStatus('connected');
    };

    recognition.onend = () => {
      setIsMicListening(false);
    };

    recognitionRef.current = recognition;
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleCallRealPhone = async () => {
    if (!ngrokUrl) {
      alert("Bitte geben Sie Ihre Ngrok URL ein (z.B. https://1234.ngrok-free.app)");
      return;
    }
    
    setIsCallingRealPhone(true);
    try {
      const res = await fetch('/api/twilio/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPhone: '+16086556067', // Hardcoded as per user request
          ngrokUrl: ngrokUrl.replace(/\/$/, '')
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert("Anruf wird aufgebaut! Ihr Telefon sollte gleich klingeln.");
      } else {
        alert("Fehler: " + data.error);
      }
    } catch (err: any) {
      alert("Ein Fehler ist aufgetreten: " + err.message);
    }
    setIsCallingRealPhone(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Intro Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl text-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900 tracking-wide">Live KI-Telefonempfang Simulieren</h2>
            </div>
            <p className="text-xs text-slate-600">
              Testen Sie, wie KI-Empfangsdame <strong className="text-blue-700">Lisa</strong> Anrufer automatisch anhand ihrer Telefonnummer identifiziert, ihren Kontext lädt und eigenständig Werkstatt- oder Kauf-Leads speichert.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800 text-xs">Automatische Werkzeugausführung</p>
              <p className="text-[11px] text-slate-500">Gemini ruft autonom <code className="text-blue-700 font-mono">save_lead()</code> auf</p>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
             <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">KI Stimme</label>
             <select
               value={selectedVoice || 'de-DE-Journey-F'}
               disabled
               className="bg-white text-blue-700 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none opacity-80 cursor-not-allowed"
             >
               <option value="de-DE-Journey-F">Aoede (Journey)</option>
             </select>
          </div>
        </div>

        {/* Real Phone Call Banner */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600 max-w-lg">
             <strong className="text-blue-700">Live-Anruf Testen:</strong> Lassen Sie sich von der KI auf Ihrem echten Telefon anrufen! Geben Sie dazu Ihre öffentliche Ngrok URL ein.
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
             <input
               type="text"
               value={ngrokUrl}
               onChange={(e) => setNgrokUrl(e.target.value)}
               placeholder="https://1234.ngrok-free.app"
               className="bg-slate-50 text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 w-full md:w-48"
             />
              <button
                onClick={handleCallRealPhone}
                disabled={isCallingRealPhone}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isCallingRealPhone ? 'Rufe an...' : 'Echten Anruf starten'}</span>
              </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Customer Picker + Phone Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Customer Selector (Kaiserslautern Region) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs uppercase tracking-widest text-slate-600 font-bold">Anrufer wählen (Kaiserslautern)</h3>
              </div>
              <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono">10 Kunden</span>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {/* Anonymous Caller Option */}
              <button
                disabled={isCallActive}
                onClick={() => handleSelectCustomer(null)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedCustomer === null
                    ? 'bg-slate-200 border-slate-300 text-slate-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                } ${isCallActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-slate-900">❓ Unbekannter Neukunde</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200">0170 98765432</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Kein Datenbank-Eintrag. KI fragt aktiv nach Kontaktdaten.</p>
              </button>

              {/* Pre-seeded Customers */}
              {customers.map(cust => {
                const isSelected = selectedCustomer?.id === cust.id;
                return (
                  <button
                    key={cust.id}
                    disabled={isCallActive}
                    onClick={() => handleSelectCustomer(cust)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-200 border-slate-300 text-slate-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                    } ${isCallActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs text-blue-700">{cust.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {cust.phone}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 mt-1 text-[11px]">
                      {cust.vehicle ? (
                        <span className="text-slate-600 flex items-center space-x-1">
                          <Car className="w-3 h-3 text-blue-600" />
                          <span>{cust.vehicle}</span>
                          {cust.licensePlate && <span className="text-slate-500 font-mono">({cust.licensePlate})</span>}
                        </span>
                      ) : (
                        <span className="text-amber-600/90 font-medium">Reine Mietkundin</span>
                      )}

                      {cust.isKnownCustomer && (
                        <span className="text-[9px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-600 px-1.5 py-0.2 rounded border border-emerald-200">
                          Stammkunde
                        </span>
                      )}
                    </div>

                    {cust.lastVisitReason && (
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        Letzter Besuch: <span className="text-slate-600">{cust.lastVisitReason}</span>
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Phone Screen Simulator */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[600px]">
            
            {/* Phone Screen Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                  isCallActive ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    {selectedCustomer ? selectedCustomer.name : customName}
                  </h3>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                    <span className="font-mono">{selectedCustomer ? selectedCustomer.phone : customPhone}</span>
                    <span>•</span>
                    <span className={`font-medium ${
                      callStatus === 'connected' || callStatus === 'assistant_speaking' || callStatus === 'customer_speaking'
                        ? 'text-emerald-600'
                        : callStatus === 'dialing' ? 'text-amber-600' : 'text-slate-500'
                    }`}>
                      {callStatus === 'idle' && 'Bereit für Anruf'}
                      {callStatus === 'dialing' && 'Wählt Autohaus Kaiserslautern...'}
                      {callStatus === 'connected' && 'Verbunden • Hört zu...'}
                      {callStatus === 'assistant_speaking' && 'Lisa spricht...'}
                      {callStatus === 'customer_speaking' && 'Anrufer spricht...'}
                      {callStatus === 'processing' && 'KI verarbeitet...'}
                      {callStatus === 'ended' && 'Anruf Beendet'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {isCallActive && (
                  <div className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] flex items-center space-x-1.5">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span>{formatTimer(callSeconds)}</span>
                  </div>
                )}

                {!isCallActive ? (
                  <button
                    onClick={handleStartCall}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200 rounded-lg font-medium text-xs transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Anrufen</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEndCall}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 rounded-lg font-medium text-xs transition-all"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>Auflegen</span>
                  </button>
                )}
              </div>
            </div>

            {/* Secret Context Bar (Injected into Gemini) */}
            <div className="bg-slate-100 border-b border-slate-200 p-2.5 px-4 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-600 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-700">Geheimer Anrufer-Kontext:</span>
                <span className="text-slate-500 truncate max-w-[320px] sm:max-w-[450px]">
                  {injectedContext ? injectedContext.replace(/\[.*?\]/g, '').trim() : (selectedCustomer ? `Kunde: ${selectedCustomer.name} | Fahrzeug: ${selectedCustomer.vehicle || 'Keines'}` : 'Unbekannter Neukunde')}
                </span>
              </div>

              <button
                onClick={() => setShowSecretContext(!showSecretContext)}
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-medium ml-2 shrink-0 text-[11px]"
              >
                {showSecretContext ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showSecretContext ? 'Ausblenden' : 'Details'}</span>
              </button>
            </div>

            {/* Secret Context Expanded Details */}
            {showSecretContext && injectedContext && (
              <div className="bg-slate-100 p-3 px-4 border-b border-slate-200 text-[11px] font-mono text-blue-700/90 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {injectedContext}
              </div>
            )}

            {/* Tool Call Autonomous Toast Alert */}
            {toolCalledToast.show && toolCalledToast.data && (
              <div className="fixed bottom-6 right-6 z-50 bg-emerald-100 border border-emerald-300 rounded-xl shadow-2xl p-4 flex items-center justify-between space-x-4 text-xs text-emerald-700 animate-fadeIn min-w-[320px] max-w-md">
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-200 p-2 rounded-full shrink-0">
                    <Zap className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-900 block mb-0.5">
                      ⚡ Werkzeug `{toolCalledToast.data.isUpdate ? 'update_lead()' : 'save_lead()'}` ausgeführt!
                    </span>
                    <p className="text-emerald-800 text-[11px] leading-snug">
                      {toolCalledToast.data.isUpdate 
                        ? `Ticket erfolgreich um weiteres Anliegen ergänzt.`
                        : `Lead für ${toolCalledToast.data.callerName} (${toolCalledToast.data.category}) in der Datenbank gespeichert.`}
                    </p>
                  </div>
                </div>
                <button onClick={() => setToolCalledToast({ show: false, data: null })} className="text-emerald-600 hover:text-emerald-900 shrink-0 font-bold ml-2 p-1">✕</button>
              </div>
            )}

            {/* Conversation Transcript Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-100/80">
              {transcript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 text-xs">Kein aktiver Anruf</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                      Klicken Sie oben rechts auf <strong className="text-emerald-600">"Anrufen"</strong>, um das Gespräch mit Lisa zu starten.
                    </p>
                  </div>
                </div>
              ) : (
                transcript.map(entry => {
                  const isAi = entry.sender === 'assistant';
                  return (
                    <div
                      key={entry.id}
                      className={`flex space-x-2.5 text-xs ${isAi ? 'justify-start' : 'justify-end'}`}
                    >
                      {isAi && (
                        <div className="w-7 h-7 rounded bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div className={`max-w-[80%] rounded-xl p-3 space-y-1 ${
                        isAi
                          ? 'bg-white border border-slate-200 text-slate-800'
                          : 'bg-blue-100 border border-blue-200 text-blue-900'
                      }`}>
                        <div className="flex items-center justify-between space-x-2 text-[10px] text-slate-500 font-mono">
                          <span className="font-semibold text-slate-600">{isAi ? 'Lisa (KI-Empfang)' : selectedCustomer?.name || 'Anrufer'}</span>
                          <span>{entry.timestamp}</span>
                        </div>
                        <p className="text-xs leading-relaxed">{entry.text}</p>
                      </div>

                      {!isAi && (
                        <div className="w-7 h-7 rounded bg-slate-200 text-slate-900 flex items-center justify-center shrink-0 font-bold text-xs border border-slate-200">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {callStatus === 'processing' && (
                <div className="flex items-center space-x-2 text-[11px] text-blue-700 bg-white p-2.5 rounded-xl border border-slate-200 w-max animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Lisa verarbeitet Eingabe...</span>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>

            {/* Quick Prompt Suggestions */}
            {isCallActive && (
              <div className="bg-slate-50 p-2 px-3 border-t border-slate-200 flex items-center space-x-2 overflow-x-auto text-xs">
                <span className="text-slate-500 shrink-0 font-bold text-[10px] uppercase tracking-wider">Schnell-Antwort:</span>
                <button
                  onClick={() => handleSendMessage('Hallo Lisa, ich brauche einen dringenden Werkstatttermin wegen meiner Klimaanlage.')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg whitespace-nowrap border border-slate-200 text-[11px] transition-colors"
                >
                  ❄️ Werkstatt Klimaanlage
                </button>
                <button
                  onClick={() => handleSendMessage('Ich würde gerne eine Probefahrt mit dem neuen Audi A4 Avant buchen.')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg whitespace-nowrap border border-slate-200 text-[11px] transition-colors"
                >
                  🚗 Probefahrt Audi A4
                </button>
                <button
                  onClick={() => handleSendMessage('Ich benötige einen Mietwagen für ein Wochenende ab Freitag.')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg whitespace-nowrap border border-slate-200 text-[11px] transition-colors"
                >
                  🔑 Mietwagen Anfrage
                </button>
                <button
                  onClick={() => handleSendMessage('Wie sind eure Öffnungszeiten am Samstag?')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg whitespace-nowrap border border-slate-200 text-[11px] transition-colors"
                >
                  🕒 Öffnungszeiten
                </button>
              </div>
            )}

            {/* Phone Input Control Bar */}
            <div className="bg-slate-50 p-3 border-t border-slate-200 flex items-center space-x-2">
              <button
                disabled={!isCallActive}
                onClick={toggleSpeechRecognition}
                className={`p-2 rounded-lg transition-all ${
                  isMicListening
                    ? 'bg-red-500/30 text-red-700 border border-red-300 animate-pulse'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                } ${!isCallActive ? 'opacity-40 cursor-not-allowed' : ''}`}
                title={isMicListening ? 'Spracheingabe beenden' : 'Sprechen (Mikrofon)'}
              >
                {isMicListening ? <Mic className="w-4 h-4 text-red-700" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                disabled={!isCallActive}
                onClick={() => {
                  const nextSpeaker = !speakerOn;
                  setSpeakerOn(nextSpeaker);
                  if (!nextSpeaker) stopSpeaking();
                }}
                className={`p-2 rounded-lg transition-all ${
                  speakerOn
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                } ${!isCallActive ? 'opacity-40 cursor-not-allowed' : ''}`}
                title={speakerOn ? 'Lautsprecher Aktiv' : 'Stumm geschaltet'}
              >
                {speakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <input
                type="text"
                disabled={!isCallActive || callStatus === 'processing'}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder={isCallActive ? 'Antwort eingeben oder sprechen...' : 'Starten Sie zuerst den Anruf...'}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-600 focus:outline-none focus:border-slate-300 disabled:opacity-50"
              />

              <button
                disabled={!isCallActive || !textInput.trim() || callStatus === 'processing'}
                onClick={() => handleSendMessage()}
                className="p-2 bg-blue-100 border border-blue-300 hover:bg-blue-200 text-blue-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
