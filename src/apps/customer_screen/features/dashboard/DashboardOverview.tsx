import React from 'react';
import { MetricsGrid } from './components/MetricsGrid';
import { AppointmentsList } from './components/AppointmentsList';
import { RecentCallsList } from './components/RecentCallsList';
import { NotificationsPanel } from './components/NotificationsPanel';
import { AiSummary } from './components/AiSummary';

export const DashboardOverview: React.FC = () => {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Übersicht</h1>
        <p className="text-xs text-slate-500 mt-1">Die wichtigsten Kennzahlen und anstehenden Aufgaben des Tages</p>
      </div>
      
      <AiSummary />
      <MetricsGrid />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AppointmentsList />
        </div>
        <div className="space-y-6">
          <NotificationsPanel />
          <RecentCallsList />
        </div>
      </div>
    </div>
  );
};
