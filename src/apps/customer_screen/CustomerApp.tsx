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
import { Login } from '../../components/Login';
import { supabase } from '../../core/supabaseClient';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [businessName, setBusinessName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'landing' | TabType>(() => {
    const hash = window.location.hash.replace('#', '');
    if (['dashboard', 'calendar', 'calls', 'customers', 'business', 'analytics', 'simulator'].includes(hash)) {
      return hash as TabType;
    }
    return 'landing';
  });

  const { customers, loading: custLoading, addCustomer: handleAddCustomer, updateCustomer: handleUpdateCustomer } = useCustomers();
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
    let mounted = true;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setIsAuthenticated(!!session);
        if (session) {
          fetchBusinessInfo(session.access_token);
        } else {
          setIsAuthLoading(false);
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setIsAuthenticated(!!session);
        if (session && event === 'SIGNED_IN') {
          fetchBusinessInfo(session.access_token);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchBusinessInfo = async (token: string) => {
    try {
      const res = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok && data.role === 'business' && data.business) {
        setBusinessName(data.business.name);
      } else if (res.status === 401 || res.status === 403 || data.role !== 'business') {
        console.error('Signing out locally because data.role is not business or unauthorized:', data);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error('Error fetching business info:', e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'landing') {
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      window.history.replaceState(null, '', `#${activeTab}`);
    }
  }, [activeTab, isAuthenticated]);

  const unreadCallsCount = leads.filter(l => l.status === 'new').length;

  if (isAuthLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Lade...</div>;
  }

  if (!isAuthenticated) {
    if (activeTab === 'landing') {
      return (
        <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-blue-500 selection:text-white flex flex-col">
          <div className="absolute top-6 right-6 z-50">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg"
            >
              Business Login
            </button>
          </div>
          <LandingPage />
        </div>
      );
    }
    
    return (
      <Login 
        type="business" 
        onLogin={() => setIsAuthenticated(true)} 
      />
    );
  }

  return (
    <div className={`min-h-screen ${activeTab === 'landing' ? 'bg-white' : 'bg-slate-50'} text-slate-800 font-sans selection:bg-blue-500 selection:text-white flex flex-col`}>
      {activeTab === 'landing' && (
        <div className="absolute top-6 right-6 z-50">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg"
          >
            Zum Dashboard
          </button>
        </div>
      )}
      {activeTab !== 'landing' && (
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadCallsCount={unreadCallsCount}
          onQuickCall={() => setActiveTab('simulator')}
          onLogout={async () => {
            await supabase.auth.signOut();
            setIsAuthenticated(false);
          }}
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

            {activeTab === 'dashboard' && <DashboardOverview businessName={businessName} />}
            
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
                onUpdateCustomer={handleUpdateCustomer}
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
