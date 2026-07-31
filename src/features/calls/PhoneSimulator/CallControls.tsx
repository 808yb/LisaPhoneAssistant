import React, { useRef, useEffect } from 'react';
import { PhoneOff, Phone, Mic, MicOff, Send, MessageSquare } from 'lucide-react';

interface CallControlsProps {
  isCallActive: boolean;
  callStatus: string;
  isMicListening: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMic: () => void;
  onSendMessage: (text: string) => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isCallActive,
  callStatus,
  isMicListening,
  onStartCall,
  onEndCall,
  onToggleMic,
  onSendMessage
}) => {
  const [textInput, setTextInput] = React.useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCallActive && callStatus !== 'processing') {
      inputRef.current?.focus();
    }
  }, [isCallActive, callStatus]);

  const handleSend = () => {
    if (textInput.trim()) {
      onSendMessage(textInput);
      setTextInput('');
    }
  };

  const quickReplies = [
    "Ich brauche einen Termin für den Ölwechsel.",
    "Was kostet ein Mietwagen fürs Wochenende?",
    "Haben Sie noch Winterreifen im Angebot?"
  ];

  if (!isCallActive) {
    return (
      <div className="bg-white p-4 border-t border-slate-200">
        <button
          onClick={onStartCall}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-4 flex items-center justify-center space-x-2 font-semibold transition-colors shadow-sm"
        >
          <Phone className="w-5 h-5" />
          <span>Anruf starten</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-slate-200 p-4">
      <div className="flex flex-col space-y-3">
        {/* Quick Replies */}
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {quickReplies.map((reply, i) => (
            <button
              key={i}
              disabled={callStatus === 'processing'}
              onClick={() => {
                setTextInput(reply);
                inputRef.current?.focus();
              }}
              className="text-[10px] whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-colors border border-slate-200 disabled:opacity-50"
            >
              {reply}
            </button>
          ))}
        </div>

        <div className="flex items-end space-x-2">
          {/* Hang Up */}
          <button
            onClick={onEndCall}
            className="w-12 h-12 shrink-0 bg-rose-500 hover:bg-rose-600 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
            title="Auflegen"
          >
            <PhoneOff className="w-5 h-5" />
          </button>

          {/* Voice Input Toggle */}
          <button
            onClick={onToggleMic}
            disabled={callStatus === 'processing' || callStatus === 'dialing'}
            className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-colors shadow-sm border ${
              isMicListening 
                ? 'bg-rose-100 border-rose-300 text-rose-600 animate-pulse'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 disabled:opacity-50'
            }`}
            title={isMicListening ? "Spracherkennung läuft..." : "Sprechen (Mikrofon)"}
          >
            {isMicListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={callStatus === 'processing' || isMicListening || callStatus === 'dialing'}
              placeholder={isMicListening ? "Höre zu..." : "Antwort tippen..."}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
            />
            <MessageSquare className="absolute right-4 top-3.5 w-4 h-4 text-slate-400" />
          </div>

          {/* Send Text */}
          <button
            onClick={handleSend}
            disabled={!textInput.trim() || callStatus === 'processing' || callStatus === 'dialing'}
            className="w-12 h-12 shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
