import React from 'react';
import { Bot } from 'lucide-react';

export const AiSummary: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Bot className="w-24 h-24" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center space-x-2 mb-3">
          <Bot className="w-5 h-5 text-blue-200" />
          <h3 className="text-sm font-semibold text-blue-100 uppercase tracking-wider">KI Tagesbericht</h3>
        </div>
        <p className="text-lg font-medium leading-relaxed">
          Guten Morgen! Gestern hat Lisa 37 Anrufe beantwortet, 9 Termine gebucht, 6 neue Kundenanfragen erfasst und 4 verpasste Anrufe verhindert. Zwei Kunden baten um Rückruf und eine häufig gestellte Frage zum Elektroauto-Service sollte Ihrer Wissensdatenbank hinzugefügt werden.
        </p>
      </div>
    </div>
  );
};
