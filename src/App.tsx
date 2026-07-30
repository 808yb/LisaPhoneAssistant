/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PhoneSimulator } from './components/PhoneSimulator';
import { LeadDashboard } from './components/LeadDashboard';
import { CustomerDatabase } from './components/CustomerDatabase';
import { BusinessFactsSettings } from './components/BusinessFactsSettings';
import { CallAnalytics } from './components/CallAnalytics';
import { LandingPage } from './components/LandingPage';
import { Customer, Lead } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'simulator' | 'leads' | 'customers' | 'settings' | 'analytics'>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'dashboard' || hash === 'leads') return 'leads';
    if (hash === 'phonesim' || hash === 'simulator') return 'simulator';
    if (['customers', 'settings', 'analytics'].includes(hash)) return hash as any;
    return 'landing';
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Customers and Leads on Mount
  const fetchInitialData = async () => {
    try {
      const [custRes, leadsRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/leads')
      ]);

      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          vehicle: c.vehicle,
          licensePlate: c.license_plate || c.licensePlate,
          isKnownCustomer: c.is_known_customer ?? c.isKnownCustomer,
          lastVisitReason: c.last_visit_reason || c.lastVisitReason,
          hasOwnCar: c.has_own_car ?? c.hasOwnCar,
          rentsFromUs: c.rents_from_us ?? c.rentsFromUs,
          notes: c.notes,
          createdAt: c.created_at || c.createdAt
        })));
      }

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData);
      }
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

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

  // Update Lead
  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updatedLead = await res.json();
        setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));
      }
    } catch (err) {
      console.error('Failed to update lead:', err);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  // Add Customer
  const handleAddCustomer = async (newCustData: Partial<Customer>) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustData)
      });
      if (res.ok) {
        await fetchInitialData();
      }
    } catch (err) {
      console.error('Failed to add customer:', err);
    }
  };

  // Callback when a new lead is autonomously saved by Gemini during a call
  const handleLeadCreatedByAi = () => {
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLeads(data);
        } else {
          console.error("Failed to fetch leads from DB:", data);
        }
      })
      .catch(err => console.error(err));
  };

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
                onLeadCreated={handleLeadCreatedByAi}
              />
            )}

            {activeTab === 'leads' && (
              <LeadDashboard
                leads={leads}
                onUpdateLead={handleUpdateLead}
                onDeleteLead={handleDeleteLead}
                onStartCallWithLead={(phone, name) => {
                  setActiveTab('simulator');
                }}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerDatabase
                customers={customers}
                onAddCustomer={handleAddCustomer}
                onSelectCustomerForCall={(cust) => {
                  setActiveTab('simulator');
                }}
              />
            )}

            {activeTab === 'settings' && (
              <BusinessFactsSettings />
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
