/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, TabType } from './features/core/Header';
import { PhoneSimulator } from './features/calls/PhoneSimulator';
import { Dashboard as CallsHistory } from './features/dashboard';
import { DashboardOverview } from './features/dashboard/DashboardOverview';
import { CalendarView } from './features/calendar/CalendarView';
import { BusinessSettings } from './features/business/BusinessSettings';
import { CustomerDatabase as CustomerList } from './features/customers/CustomerList';
import { CallAnalytics } from './features/calls/CallAnalytics';
import { LandingPage } from './features/core/LandingPage';
import { useCustomers } from './features/customers/hooks/useCustomers';
import { useLeads } from './features/dashboard/hooks/useLeads';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | TabType>(() => {
    const hash = window.location.hash.replace('#', '');
    if (['dashboard', 'calendar', 'calls', 'customers', 'business', 'analytics', 'simulator'].includes(hash)) {
      return hash as TabType;
    }
    return 'landing';
  });

  const { customers, loading: custLoading, addCustomer: handleAddCustomer } = useCustomers();
  const { leads, loading: leadsLoading, updateLead: handleUpdateLead, deleteLead: handleDeleteLead, fetchLeads: handleLeadCreatedByAi } = useLeads();
  const loading = custLoading || leadsLoading;

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'calendar', 'calls', 'customers', 'business', 'analytics', 'simulator'].includes(hash)) {
        setActiveTab(hash as TabType);
      } else {
        setActiveTab('landing');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (activeTab === 'landing') {
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      window.history.replaceState(null, '', `#${activeTab}`);
    }
  }, [activeTab]);

  const unreadCallsCount = leads.filter(l => l.status === 'new').length;

  return (
    <div className={`min-h-screen ${activeTab === 'landing' ? 'bg-white' : 'bg-slate-50'} text-slate-800 font-sans selection:bg-blue-500 selection:text-white flex flex-col`}>
      {activeTab !== 'landing' && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadCallsCount={unreadCallsCount}
          onQuickCall={() => setActiveTab('simulator')}
        />
      )}

      <main className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-500 text-xs uppercase tracking-widest font-mono animate-pulse">
            Lade Autohaus KI-Assistent...
          </div>
        ) : (
          <>
            {activeTab === 'landing' && <LandingPage />}

            {activeTab === 'dashboard' && <DashboardOverview />}
            
            {activeTab === 'calendar' && <CalendarView />}

            {activeTab === 'calls' && (
              <CallsHistory
                leads={leads}
                onUpdateLead={handleUpdateLead}
                onDeleteLead={handleDeleteLead}
                onStartCallWithLead={(phone, name) => setActiveTab('simulator')}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerList
                customers={customers}
                onAddCustomer={handleAddCustomer}
                onSelectCustomerForCall={(cust) => setActiveTab('simulator')}
              />
            )}

            {activeTab === 'business' && <BusinessSettings />}

            {activeTab === 'analytics' && <CallAnalytics leads={leads} />}

            {activeTab === 'simulator' && (
              <PhoneSimulator
                customers={customers}
                onLeadCreated={() => handleLeadCreatedByAi(false)}
              />
            )}
          </>
        )}
      </main>

      {activeTab !== 'landing' && (
        <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-[10px] uppercase tracking-widest text-slate-500 font-medium">
          <p>Autohaus KI-Assistent &bull; Powering 24/7 Voice Intelligence</p>
        </footer>
      )}
    </div>
  );
}
