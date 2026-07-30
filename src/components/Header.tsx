import React from 'react';
import { Phone, Users, ClipboardList, Settings, BarChart2, Bot, Circle, Sparkles, Car } from 'lucide-react';

interface HeaderProps {
  activeTab: 'simulator' | 'leads' | 'customers' | 'settings' | 'analytics';
  setActiveTab: (tab: 'simulator' | 'leads' | 'customers' | 'settings' | 'analytics') => void;
  unreadLeadsCount: number;
  onQuickCall: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  unreadLeadsCount,
  onQuickCall
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 text-slate-600 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg tracking-tight text-slate-800 italic">Lisa</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider hidden">
                  Gemini 3.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Deine KI Assistentin</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'simulator'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Telefon-Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                activeTab === 'leads'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lead-Tickets</span>
              {unreadLeadsCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded bg-emerald-200 text-slate-900 border border-emerald-300">
                  {unreadLeadsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'customers'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Kundenkartei</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Stammdaten</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Analysen</span>
            </button>
          </nav>

          {/* Live Status & Quick Action */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></div>
              <span className="uppercase tracking-wider font-semibold text-[10px]">AI System Online</span>
            </div>

            <button
              onClick={onQuickCall}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600 text-xs font-medium transition-all shadow-sm"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Anruf starten</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Subnav */}
      <div className="md:hidden flex items-center justify-around bg-white border-t border-slate-200 py-2 px-1 text-[11px]">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'simulator' ? 'text-blue-600 font-medium bg-blue-50' : 'text-slate-500'
          }`}
        >
          <Phone className="w-3.5 h-3.5 mb-0.5 text-indigo-500" />
          <span>Anrufen</span>
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex flex-col items-center py-1 px-2 rounded relative ${
            activeTab === 'leads' ? 'text-blue-600 font-medium bg-blue-50' : 'text-slate-500'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 mb-0.5 text-emerald-500" />
          <span>Leads</span>
          {unreadLeadsCount > 0 && (
            <span className="absolute top-0 right-1 px-1 py-0.2 text-[9px] font-mono rounded bg-emerald-200 text-slate-900 font-bold border border-emerald-300">
              {unreadLeadsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'customers' ? 'text-blue-600 font-medium bg-blue-50' : 'text-slate-500'
          }`}
        >
          <Users className="w-3.5 h-3.5 mb-0.5 text-purple-500" />
          <span>Kunden</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'settings' ? 'text-blue-600 font-medium bg-blue-50' : 'text-slate-500'
          }`}
        >
          <Settings className="w-3.5 h-3.5 mb-0.5 text-amber-500" />
          <span>Stammdaten</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center py-1 px-2 rounded ${
            activeTab === 'analytics' ? 'text-blue-600 font-medium bg-blue-50' : 'text-slate-500'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5 mb-0.5 text-sky-500" />
          <span>Analysen</span>
        </button>
      </div>
    </header>
  );
};
