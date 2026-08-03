import React from 'react';
import { Calendar as CalendarIcon, Clock, User, Plus } from 'lucide-react';

export const CalendarView: React.FC = () => {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Kalender</h1>
        <div className="flex space-x-2">
          <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Heute
          </button>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button className="px-3 py-1 bg-white shadow-sm rounded-md text-sm font-medium text-slate-800">Woche</button>
            <button className="px-3 py-1 text-slate-600 hover:text-slate-800 rounded-md text-sm font-medium transition-colors">Monat</button>
          </div>
          <button className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Neuer Termin</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Placeholder for Calendar Grid */}
        <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50 border-t border-slate-200 p-8 text-center">
          <div>
            <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-lg font-medium text-slate-600">Kalenderansicht</p>
            <p className="text-sm mt-1">Implementieren Sie hier die Drag-and-Drop Kalender-Komponente</p>
          </div>
        </div>
      </div>
    </div>
  );
};
