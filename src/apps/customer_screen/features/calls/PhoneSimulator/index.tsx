import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, ShieldCheck, Phone, Eye, EyeOff, Volume2, VolumeX,
  CheckCircle2, Info, Clock
} from 'lucide-react';
import { Customer } from '../../../../../core/types';
import { useCallSession } from './useCallSession';
import { CallerSetup } from './CallerSetup';
import { TranscriptView } from './TranscriptView';
import { CallControls } from './CallControls';

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

  const [ngrokUrl, setNgrokUrl] = useState<string>('');
  const [isCallingRealPhone, setIsCallingRealPhone] = useState<boolean>(false);
  const [showSecretContext, setShowSecretContext] = useState<boolean>(true);

  // The single voice for now
  const selectedVoice = 'de-DE-Journey-F';

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const {
    isCallActive,
    callStatus,
    transcript,
    injectedContext,
    toolCalledToast,
    setToolCalledToast,
    callSeconds,
    isMicListening,
    isMuted,
    setIsMuted,
    speakerOn,
    setSpeakerOn,
    handleStartCall,
    handleEndCall,
    handleSendMessage,
    toggleSpeechRecognition
  } = useCallSession(selectedCustomer, customPhone, onLeadCreated, selectedVoice);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, callStatus]);

  useEffect(() => {
    if (!isCallActive && selectedCustomer === null) {
      setCustomPhone(generateRandomPhone());
    }
  }, [isCallActive, selectedCustomer]);

  const generateRandomPhone = () => {
    return '017' + Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  const handleSelectCustomer = (cust: Customer | null) => {
    if (isCallActive) return;
    setSelectedCustomer(cust);
    if (cust) {
      setCustomPhone(cust.phone);
      setCustomName(cust.name);
    } else {
      setCustomPhone(generateRandomPhone());
      setCustomName('Unbekannter Neukunde');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCallRealPhone = async () => {
    let publicUrl = window.location.origin;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      if (!ngrokUrl) {
        alert("Bitte geben Sie Ihre Ngrok URL ein (z.B. https://1234.ngrok-free.app)");
        return;
      }
      publicUrl = ngrokUrl;
    }

    setIsCallingRealPhone(true);
    try {
      const res = await fetch('/api/twilio/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPhone: customPhone,
          ngrokUrl: publicUrl.replace(/\/$/, '')
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
              Testen Sie, wie KI-Empfangsdame <strong className="text-blue-700">Lisa</strong> Anrufer automatisch anhand ihrer Telefonnummer identifiziert.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800 text-xs">Automatische Werkzeugausführung</p>
              <p className="text-[11px] text-slate-500">Gemini ruft autonom <code className="text-blue-700 font-mono">save_lead()</code> auf</p>
            </div>
          </div>
        </div>

        {/* Real Phone Call Banner */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600 max-w-lg">
            <strong className="text-blue-700">Live-Anruf Testen:</strong> Geben Sie Ihre echte Nummer (mit Ländercode, z.B. +49...) und Ngrok URL ein.
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <input
              type="text"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              placeholder="+49 151 12345678"
              className="bg-slate-50 text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 w-full md:w-40"
            />
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

        {/* Left Column: Customer Selector */}
        <div className="lg:col-span-5 space-y-4">
          <CallerSetup
            customers={customers}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={handleSelectCustomer}
            isCallActive={isCallActive}
            customPhone={customPhone}
          />
        </div>

        {/* Right Column: Phone Screen Simulator */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[600px]">

            {/* Phone Screen Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${isCallActive ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
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
                    <span className={`font-medium ${callStatus === 'connected' || callStatus === 'assistant_speaking' || callStatus === 'customer_speaking'
                      ? 'text-emerald-600'
                      : callStatus === 'dialing' ? 'text-amber-600' : 'text-slate-500'
                      }`}>
                      {callStatus === 'idle' && 'Bereit'}
                      {callStatus === 'dialing' && 'Wählt...'}
                      {callStatus === 'connected' && 'Verbunden'}
                      {callStatus === 'assistant_speaking' && 'Lisa spricht...'}
                      {callStatus === 'customer_speaking' && 'Kunde spricht...'}
                      {callStatus === 'processing' && 'Lisa denkt nach...'}
                      {callStatus === 'ended' && 'Anruf beendet'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-slate-500 font-mono text-sm font-medium bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimer(callSeconds)}</span>
                  </div>
                </div>

                {/* Developer Toggles */}
                <div className="flex bg-slate-200 p-1 rounded-lg border border-slate-300">
                  <button
                    onClick={() => setShowSecretContext(!showSecretContext)}
                    className={`p-1.5 rounded text-xs transition-colors ${showSecretContext ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Gemini Kontext anzeigen/verbergen"
                  >
                    {showSecretContext ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setSpeakerOn(!speakerOn)}
                    className={`p-1.5 rounded text-xs transition-colors ${speakerOn ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Lautsprecher/Sprachausgabe (TTS) an/aus"
                  >
                    {speakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Injected Context Alert */}
            {injectedContext && showSecretContext && (
              <div className="bg-indigo-50 border-b border-indigo-100 p-3 text-xs text-indigo-800 shadow-inner flex items-start space-x-2">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-indigo-900 block mb-0.5">Dem KI-Assistenten übergebener Kontext (DB Lookup):</strong>
                  <span className="font-mono text-[12px] bg-white/60 px-1.5 py-0.5 rounded whitespace-pre-wrap">{injectedContext}</span>
                </div>
              </div>
            )}

            {/* Tool Execution Toast */}
            {toolCalledToast.show && (
              <div className="bg-emerald-50 border-b border-emerald-100 p-3 text-xs text-emerald-800 shadow-inner flex items-start space-x-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-emerald-900 block mb-0.5">
                    {toolCalledToast.data.isUpdate ? 'Lead aktualisiert' : 'Lead gespeichert'}
                  </strong>
                  Die KI hat autonom die Funktion {toolCalledToast.data.isUpdate ? 'update_lead()' : 'save_lead()'} aufgerufen.
                </div>
                <button
                  onClick={() => setToolCalledToast({ show: false, data: null })}
                  className="ml-auto text-emerald-500 hover:text-emerald-700 font-bold"
                >×</button>
              </div>
            )}

            {/* Transcript */}
            <TranscriptView
              transcript={transcript}
              callStatus={callStatus}
              transcriptEndRef={transcriptEndRef}
            />

            {/* Controls */}
            <CallControls
              isCallActive={isCallActive}
              callStatus={callStatus}
              isMicListening={isMicListening}
              onStartCall={handleStartCall}
              onEndCall={handleEndCall}
              onToggleMic={toggleSpeechRecognition}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
