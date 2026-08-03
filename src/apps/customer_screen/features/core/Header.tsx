import React from 'react';
import { LayoutDashboard, Calendar, PhoneCall, Users, Building2, BarChart2, Settings, Phone } from 'lucide-react';

export type TabType = 'dashboard' | 'calendar' | 'calls' | 'customers' | 'business' | 'analytics' | 'simulator';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  unreadCallsCount?: number;
  onQuickCall: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  unreadCallsCount = 0,
  onQuickCall
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Übersicht', icon: LayoutDashboard, color: 'text-slate-500', activeColor: 'text-blue-700', activeBg: 'bg-blue-50 border-blue-200' },
    { id: 'calendar', label: 'Kalender', icon: Calendar, color: 'text-slate-500', activeColor: 'text-blue-700', activeBg: 'bg-blue-50 border-blue-200' },
    { id: 'calls', label: 'Anrufe', icon: PhoneCall, color: 'text-slate-500', activeColor: 'text-blue-700', activeBg: 'bg-blue-50 border-blue-200', count: unreadCallsCount },
    { id: 'customers', label: 'Kunden', icon: Users, color: 'text-slate-500', activeColor: 'text-blue-700', activeBg: 'bg-blue-50 border-blue-200' },
    { id: 'business', label: 'Geschäft', icon: Building2, color: 'text-slate-500', activeColor: 'text-blue-700', activeBg: 'bg-blue-50 border-blue-200' },
    { id: 'analytics', label: 'Analysen', icon: BarChart2, color: 'text-slate-500', activeColor: 'text-blue-700', activeBg: 'bg-blue-50 border-blue-200' },
    { id: 'simulator', label: 'Testanruf', icon: Phone, color: 'text-slate-500', activeColor: 'text-blue-700', activeBg: 'bg-blue-50 border-blue-200' },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 text-slate-600 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 w-48">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg tracking-tight text-slate-800 italic">Lisa</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Deine KI Assistentin</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center justify-center flex-1 space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                    isActive
                      ? `${item.activeBg} ${item.activeColor} border shadow-sm`
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? item.activeColor : item.color}`} />
                  <span>{item.label}</span>
                  {('count' in item && item.count) ? (
                    <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded bg-emerald-200 text-slate-900 border border-emerald-300 ml-1">
                      {(item as any).count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Live Status & Quick Action */}
          <div className="flex items-center justify-end space-x-3 w-48">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></div>
              <span className="uppercase tracking-wider font-semibold text-[10px]">Lisa ist Aktiv</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Subnav (Horizontal scroll) */}
      <div className="md:hidden flex items-center overflow-x-auto bg-white border-t border-slate-200 py-2 px-2 space-x-2 no-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`flex flex-col items-center flex-shrink-0 py-1 px-3 rounded-lg relative ${
                isActive ? `${item.activeBg} ${item.activeColor}` : 'text-slate-500'
              }`}
            >
              <Icon className={`w-4 h-4 mb-1 ${isActive ? item.activeColor : item.color}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {('count' in item && item.count) ? (
                <span className="absolute top-0 right-1 px-1 py-0.2 text-[9px] font-mono rounded bg-emerald-200 text-slate-900 font-bold border border-emerald-300">
                  {(item as any).count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </header>
  );
};
