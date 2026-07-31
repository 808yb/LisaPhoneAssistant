/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './features/core/Header';
import { PhoneSimulator } from './features/calls/PhoneSimulator';
import { Dashboard } from './features/dashboard';
import { CustomerDatabase as CustomerList } from './features/customers/CustomerList';
import { BusinessFactsSettings as Settings } from './features/settings/Settings';
import { CallAnalytics } from './features/calls/CallAnalytics';
import { LandingPage } from './features/core/LandingPage';
import { Customer, Lead } from './core/types';
import { useCustomers } from './features/customers/hooks/useCustomers';
import { useLeads } from './features/dashboard/hooks/useLeads';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'simulator' | 'leads' | 'customers' | 'settings' | 'analytics'>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'dashboard' || hash === 'leads') return 'leads';
    if (hash === 'phonesim' || hash === 'simulator') return 'simulator';
    if (['customers', 'settings', 'analytics'].includes(hash)) return hash as any;
    return 'landing';
  });
  const { customers, loading: custLoading, addCustomer: handleAddCustomer } = useCustomers();
  const { leads, loading: leadsLoading, updateLead: handleUpdateLead, deleteLead: handleDeleteLead, fetchLeads: handleLeadCreatedByAi } = useLeads();
  const loading = custLoading || leadsLoading;

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'dashboard' || hash === 'leads') setActiveTab('leads');
      else if (hash === 'phonesim' || hash === 'simulator') setActiveTab('simulator');
      else if (['customers', 'settings', 'analytics'].includes(hash)) setActiveTab(hash as any);
      else setActiveTab('landing');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (activeTab === 'landing') {
      window.history.replaceState(null, '', window.location.pathname);
    } else if (activeTab === 'leads') {
      window.history.replaceState(null, '', '#leads');
    } else if (activeTab === 'simulator') {
      window.history.replaceState(null, '', '#phonesim');
    } else {
      window.history.replaceState(null, '', `#${activeTab}`);
    }
  }, [activeTab]);

  const unreadLeadsCount = leads.filter(l => l.status === 'new').length;

  return (
    <div className={`min-h-screen ${activeTab === 'landing' ? 'bg-white' : 'bg-slate-50'} ${activeTab === 'landing' ? 'text-slate-800' : 'text-slate-800'} font-sans selection:bg-blue-500 selection:text-white flex flex-col`}>
      {activeTab !== 'landing' && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadLeadsCount={unreadLeadsCount}
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
            {activeTab === 'landing' && (
              <LandingPage />
            )}

            {activeTab === 'simulator' && (
              <PhoneSimulator
                customers={customers}
                onLeadCreated={() => handleLeadCreatedByAi(false)}
              />
            )}

            {activeTab === 'leads' && (
              <Dashboard
                leads={leads}
                onUpdateLead={handleUpdateLead}
                onDeleteLead={handleDeleteLead}
                onStartCallWithLead={(phone, name) => {
                  setActiveTab('simulator');
                }}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerList
                customers={customers}
                onAddCustomer={handleAddCustomer}
                onSelectCustomerForCall={(cust) => {
                  setActiveTab('simulator');
                }}
              />
            )}

            {activeTab === 'settings' && (
              <Settings />
            )}

            {activeTab === 'analytics' && (
              <CallAnalytics leads={leads} />
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
