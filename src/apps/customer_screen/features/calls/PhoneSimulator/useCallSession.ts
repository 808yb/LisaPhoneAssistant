import { useState, useRef, useEffect, useCallback } from 'react';
import { Customer, TranscriptEntry } from '../../../../../core/types';
import { speakText, stopSpeaking, unlockAudio } from '../audio';
import { supabase } from '../../../../../core/supabaseClient';

export const useCallSession = (selectedCustomer: Customer | null, customPhone: string, onLeadCreated: () => void, selectedVoice: string | null) => {
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'dialing' | 'connected' | 'assistant_speaking' | 'customer_speaking' | 'processing' | 'ended'>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [injectedContext, setInjectedContext] = useState<string>('');
  const [fillers, setFillers] = useState<any[]>([]);
  const [hasSavedLead, setHasSavedLead] = useState<boolean>(false);
  const [toolCalledToast, setToolCalledToast] = useState<{ show: boolean; data: any }>({ show: false, data: null });
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  
  // Audio controls state
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speakerOn, setSpeakerOn] = useState<boolean>(true);

  const callIdRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Timer logic
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => setCallSeconds(prev => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  const handleStartCall = useCallback(async () => {
    unlockAudio();
    stopSpeaking();
    setIsCallActive(true);
    setCallStatus('dialing');
    setTranscript([]);
    setInjectedContext('');
    setHasSavedLead(false);
    setToolCalledToast({ show: false, data: null });

    const currentPhone = selectedCustomer ? selectedCustomer.phone : customPhone;
    const currentCallId = Date.now();
    callIdRef.current = currentCallId;

    setTimeout(async () => {
      setCallStatus('connected');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const res = await fetch('/api/voice/interact', {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            phoneNumber: currentPhone, 
            isFirstGreeting: true, 
            history: [],
            callId: String(currentCallId)
          })
        });

        const data = await res.json();
        if (data.success && callIdRef.current === currentCallId) {
          setInjectedContext(data.injectedContext);
          if (data.fillers) setFillers(data.fillers);
          
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
  }, [selectedCustomer, customPhone, speakerOn, isMuted, selectedVoice]);

  const handleEndCall = useCallback(() => {
    callIdRef.current = 0;
    stopSpeaking();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setCallStatus('ended');
    setIsCallActive(false);
    setIsMicListening(false);
  }, []);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !isCallActive || callStatus === 'processing') return;

    stopSpeaking();
    setCallStatus('processing');

    const userEntry: TranscriptEntry = {
      id: 't-user-' + Date.now(),
      sender: 'customer',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...transcript, userEntry];
    setTranscript(newHistory);

    if (speakerOn && !isMuted && fillers && fillers.length > 0) {
      const lower = messageText.toLowerCase();
      
      // Skip fillers for obvious farewells or short 'no' responses
      const isFarewell = /^(nein|nein danke|nein, danke|tschüss|auf wiedersehen|das war's|das wars|nichts weiter|nein das war alles|nein danke das war alles)([\s.,!]*)$/i.test(lower.trim());
      
      if (!isFarewell) {
        let matchedFiller = null;
        
        // 1. Try to find a specific keyword match
        for (const filler of fillers) {
          if (!filler.keywords || filler.keywords.trim() === '' || filler.keywords.trim() === '*') continue;
          const keywords = filler.keywords.split(',').map((k: string) => k.trim().toLowerCase()).filter((k: string) => k.length > 0);
          if (keywords.some((k: string) => lower.includes(k))) {
            matchedFiller = filler;
            break;
          }
        }

        // 2. If no specific match, find a default filler (empty keywords or '*')
        if (!matchedFiller) {
          const defaultFillers = fillers.filter((f: any) => !f.keywords || f.keywords.trim() === '' || f.keywords.trim() === '*');
          if (defaultFillers.length > 0) {
            matchedFiller = defaultFillers[Math.floor(Math.random() * defaultFillers.length)];
          } else {
            // Absolute fallback if nothing else is defined
            matchedFiller = fillers[Math.floor(Math.random() * fillers.length)];
          }
        }

        if (matchedFiller && matchedFiller.texts && matchedFiller.texts.length > 0) {
          const randomText = matchedFiller.texts[Math.floor(Math.random() * matchedFiller.texts.length)];
          speakText(randomText, selectedVoice);
        }
      }
    }

    try {
      const currentPhone = selectedCustomer ? selectedCustomer.phone : customPhone;
      const currentCallId = callIdRef.current;

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/voice/interact', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phoneNumber: currentPhone,
          userMessage: messageText,
          history: newHistory,
          hasSavedLead,
          callId: String(callIdRef.current)
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

        if (data.toolCalled && data.updatedLeadData) {
          setToolCalledToast({ show: true, data: { isUpdate: true, concern: data.updatedLeadData.concern } });
          onLeadCreated();
        } else if (data.toolCalled && data.savedLeadData) {
          setHasSavedLead(true);
          setToolCalledToast({ show: true, data: data.savedLeadData });
          onLeadCreated();
        }

        setCallStatus('assistant_speaking');
        if (speakerOn && !isMuted) {
          speakText(data.text, selectedVoice, () => {
            if (callIdRef.current === currentCallId) {
              if (data.endCall) {
                setCallStatus('idle');
                setIsCallActive(false);
              } else {
                setCallStatus('connected');
              }
            }
          });
        } else {
          if (data.endCall) {
            setCallStatus('idle');
            setIsCallActive(false);
          } else {
            setCallStatus('connected');
          }
        }
      }
    } catch (err) {
      console.error('Voice interact error:', err);
      setCallStatus('connected');
    }
  }, [isCallActive, callStatus, transcript, selectedCustomer, customPhone, hasSavedLead, onLeadCreated, speakerOn, isMuted, selectedVoice]);

  const latestHandleSendMessage = useRef(handleSendMessage);
  useEffect(() => {
    latestHandleSendMessage.current = handleSendMessage;
  }, [handleSendMessage]);

  const toggleSpeechRecognition = useCallback(() => {
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
    recognition.start();
  }, [isMicListening]);

  return {
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
  };
};
