import React, { useState } from 'react';
import { Sidebar, HQTabType } from './components/Sidebar';
import { Building2, Wand2 } from 'lucide-react';
import { FleetView } from './features/fleet/FleetView';
import { Dashboard } from './features/dashboard/Dashboard';
import { BusinessesTable } from './features/businesses/BusinessesTable';
import { LiveCallsTable } from './features/calls/LiveCallsTable';

export default function LisaHQApp() {
  const [activeTab, setActiveTab] = useState<HQTabType>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'fleet':
        return <FleetView />;
      case 'businesses':
        return <BusinessesTable />;
      case 'calls':
        return <LiveCallsTable />;
      default:
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 max-w-lg mx-auto mt-20 text-center space-y-4">
            <Building2 className="w-16 h-16 text-blue-600 mx-auto" />
            <h1 className="text-3xl font-bold text-slate-800 capitalize">{activeTab}</h1>
            <p className="text-slate-500">
              Willkommen im Agentur-Dashboard. Dieses Modul befindet sich im Aufbau.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 overflow-y-auto">
        {/* Placeholder for header/search */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between sticky top-0 z-10">
          <div className="text-slate-400 text-sm">LisaHQ / {activeTab}</div>
          <div className="flex items-center space-x-4 text-sm font-medium text-slate-600">
            <span>Admin</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
