import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Clock, Phone, MapPin, Sparkles, Check, AlertCircle } from 'lucide-react';
import { BusinessFacts } from '../types';

export const BusinessFactsSettings: React.FC = () => {
  const [facts, setFacts] = useState<BusinessFacts | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/business-facts')
      .then(res => res.json())
      .then(data => {
        setFacts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load facts:', err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facts) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/business-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facts)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save facts:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !facts) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-600">
        <div className="animate-pulse">Lade Stammdaten & KI-Einstellungen...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900 tracking-wide">Stammdaten & KI-Guardrails</h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Verwalten Sie die Geschäftsdaten (Öffnungszeiten, Notdienst, Mietwagen) und Systemanweisungen für die KI-Empfangsdame.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-medium animate-fadeIn">
            <Check className="w-3.5 h-3.5" />
            <span>Stammdaten erfolgreich gespeichert!</span>
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Business Facts */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center space-x-2 border-b border-slate-200 pb-3">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Geschäftsinformationen & Öffnungszeiten</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Name des Autohauses</label>
                <input
                  type="text"
                  value={facts.dealershipName}
                  onChange={e => setFacts({ ...facts, dealershipName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-slate-300"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Telefonzentrale</label>
                <input
                  type="text"
                  value={facts.phone}
                  onChange={e => setFacts({ ...facts, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Adresse</label>
              <input
                type="text"
                value={facts.address}
                onChange={e => setFacts({ ...facts, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-slate-300"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-slate-700 font-semibold block flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Öffnungszeiten Verkauf & Werkstatt</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">Verkauf Wochentags</span>
                  <input
                    type="text"
                    value={facts.openingHours.weekdays}
                    onChange={e => setFacts({
                      ...facts,
                      openingHours: { ...facts.openingHours, weekdays: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-slate-300"
                  />
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Verkauf Samstag</span>
                  <input
                    type="text"
                    value={facts.openingHours.saturday}
                    onChange={e => setFacts({
                      ...facts,
                      openingHours: { ...facts.openingHours, saturday: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-slate-300"
                  />
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Werkstatt Öffnungszeiten</span>
                <input
                  type="text"
                  value={facts.workshopHours}
                  onChange={e => setFacts({ ...facts, workshopHours: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Mietwagen Konditionen</label>
                <input
                  type="text"
                  value={facts.rentalRates}
                  onChange={e => setFacts({ ...facts, rentalRates: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-slate-300"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">24/7 Notdienst Nummer</label>
                <input
                  type="text"
                  value={facts.emergencyNumber}
                  onChange={e => setFacts({ ...facts, emergencyNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Aktuelles Sonderangebot / Aktion</label>
              <input
                type="text"
                value={facts.specialOffers}
                onChange={e => setFacts({ ...facts, specialOffers: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Right Column: AI Guardrails & Prompt Instruction */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center space-x-2 border-b border-slate-200 pb-3">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>KI Guardrails & Anweisungen</span>
            </h3>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Legen Sie fest, wie sich die KI-Empfangsdame am Telefon verhalten soll und welche Themen ausgeschlossen sind.
              </p>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">System-Prompt & Verhaltens-Regeln</label>
                <textarea
                  rows={8}
                  value={facts.guardrailsPrompt}
                  onChange={e => setFacts({ ...facts, guardrailsPrompt: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-slate-300 leading-relaxed"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 text-[11px] space-y-1">
                <span className="font-bold uppercase tracking-wider text-[10px] text-blue-700 block flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Sicherheits-Leitplanken</span>
                </span>
                <p className="text-slate-600">
                  Gemini Flash beachtet diese Guardrails strikt bei jedem Anruf und verweigert fachfremde Anfragen (z.B. medizinische oder juristische Fragen).
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-slate-200 hover:bg-white/15 text-slate-900 border border-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Speichere Änderungen...' : 'Änderungen Übernehmen'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
