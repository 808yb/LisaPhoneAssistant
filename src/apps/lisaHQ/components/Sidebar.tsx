import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  PhoneCall, 
  BarChart2, 
  AlertTriangle, 
  Activity, 
  CreditCard, 
  Wand2, 
  Copy, 
  Users, 
  Settings, 
  LifeBuoy, 
  TrendingUp, 
  Radar 
} from 'lucide-react';

export type HQTabType = 
  | 'dashboard'
  | 'businesses'
  | 'calls'
  | 'analytics'
  | 'alerts'
  | 'monitor'
  | 'billing'
  | 'onboarding'
  | 'templates'
  | 'team'
  | 'settings'
  | 'support'
  | 'growth'
  | 'fleet';

interface SidebarProps {
  activeTab: HQTabType;
  setActiveTab: (tab: HQTabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navGroups = [
    {
      title: 'Übersicht',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'fleet', label: 'Betriebsstatus', icon: Radar, badge: 'Beta' },
        { id: 'businesses', label: 'Unternehmen', icon: Building2 },
        { id: 'calls', label: 'Live-Anrufe', icon: PhoneCall },
      ]
    },
    {
      title: 'Performance',
      items: [
        { id: 'analytics', label: 'Analysen', icon: BarChart2 },
        { id: 'growth', label: 'Wachstum', icon: TrendingUp },
        { id: 'billing', label: 'Abrechnung', icon: CreditCard },
      ]
    },
    {
      title: 'Betrieb',
      items: [
        { id: 'onboarding', label: 'Onboarding', icon: Wand2 },
        { id: 'templates', label: 'Vorlagen', icon: Copy },
        { id: 'support', label: 'Support', icon: LifeBuoy },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'alerts', label: 'Warnungen', icon: AlertTriangle },
        { id: 'monitor', label: 'KI Monitor', icon: Activity },
        { id: 'team', label: 'Agentur-Team', icon: Users },
        { id: 'settings', label: 'Plattform-Einstellungen', icon: Settings },
      ]
    }
  ];

  return (
    <div className="w-64 bg-slate-900 min-h-screen text-slate-300 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-6 sticky top-0 bg-slate-900 z-10">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Building2 className="w-6 h-6 text-blue-500" />
          <span>Lisa HQ</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Superadmin Panel</p>
      </div>

      <div className="flex-1 px-4 py-2 space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as HQTabType)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white font-medium shadow-md' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-blue-500 text-blue-50' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
