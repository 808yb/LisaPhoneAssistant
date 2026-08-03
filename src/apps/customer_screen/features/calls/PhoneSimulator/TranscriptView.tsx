import React from 'react';
import { User, Bot } from 'lucide-react';
import { TranscriptEntry } from '../../../../../core/types';

interface TranscriptViewProps {
  transcript: TranscriptEntry[];
  callStatus: string;
  transcriptEndRef: React.RefObject<HTMLDivElement>;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  transcript,
  callStatus,
  transcriptEndRef
}) => {
  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto p-4 space-y-4">
      {transcript.length === 0 ? (
        <div className="h-full flex items-center justify-center text-slate-400 text-[11px] uppercase tracking-widest font-mono">
          Anruf starten, um Konversation zu beginnen
        </div>
      ) : (
        transcript.map((msg, idx) => (
          <div key={msg.id} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-3 ${
              msg.sender === 'customer'
                ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
            }`}>
              <div className="flex items-center space-x-1.5 mb-1.5 opacity-70">
                {msg.sender === 'assistant' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                <span className="text-[9px] uppercase tracking-wider font-bold">
                  {msg.sender === 'assistant' ? 'Lisa (KI)' : 'Kunde'} • {msg.timestamp}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))
      )}
      
      {/* Loading Indicators */}
      {callStatus === 'processing' && (
        <div className="flex justify-start">
          <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 shadow-sm">
            <div className="flex space-x-1.5">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>
        </div>
      )}
      <div ref={transcriptEndRef} />
    </div>
  );
};
