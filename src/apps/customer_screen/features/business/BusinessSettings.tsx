import React, { useState } from 'react';
import { Building2, Clock, Wrench, Users, CalendarDays, BookOpen, Bot, Settings2 } from 'lucide-react';

export const BusinessSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Allgemeine Informationen', icon: Building2 },
    { id: 'hours', label: 'Öffnungszeiten', icon: Clock },
    { id: 'services', label: 'Dienstleistungen', icon: Wrench },
    { id: 'employees', label: 'Mitarbeiter', icon: Users },
    { id: 'appointment-rules', label: 'Terminregeln', icon: CalendarDays },
    { id: 'knowledge-base', label: 'Wissensdatenbank', icon: BookOpen },
    { id: 'ai-behavior', label: 'KI-Verhalten', icon: Bot },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex flex-col h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Geschäft</h1>
        <p className="text-xs text-slate-500 mt-1">Hier verwalten Sie alles, was Lisa über Ihr Unternehmen weiß und wie sie agiert.</p>
      </div>
      
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Einstellungen</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 bg-white overflow-y-auto">
          <div className="max-w-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <Settings2 className="w-6 h-6 text-slate-400" />
              <h2 className="text-xl font-bold text-slate-800">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
            </div>
            
            {/* Placeholder Content */}
            <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-center">
              <Settings2 className="w-12 h-12 mb-3 text-slate-300" />
              <p className="font-medium text-slate-600">Konfigurationsbereich</p>
              <p className="text-sm mt-1">Implementieren Sie hier die Felder für: {tabs.find(t => t.id === activeTab)?.label}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
