import React, { useState, useEffect } from 'react';
import { Building2, Clock, Wrench, Users, CalendarDays, BookOpen, Bot, Settings2, Save, Check, Info, ShieldCheck, X, Wand2, Loader2, Network } from 'lucide-react';
import { supabase } from '../../../../core/supabaseClient';
import { BusinessFacts } from '../../../../core/types';

const defaultSchedule = [
  { day: 'Montag', open: '08:00', close: '18:00', closed: false },
  { day: 'Dienstag', open: '08:00', close: '18:00', closed: false },
  { day: 'Mittwoch', open: '08:00', close: '18:00', closed: false },
  { day: 'Donnerstag', open: '08:00', close: '18:00', closed: false },
  { day: 'Freitag', open: '08:00', close: '18:00', closed: false },
  { day: 'Samstag', open: '09:00', close: '14:00', closed: false },
  { day: 'Sonntag', open: '00:00', close: '00:00', closed: true },
];

const parseSchedule = (data: any) => {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    } catch(e) {}
  }
  return defaultSchedule;
};

const WeeklySchedule = ({ value, onChange, label }: { value: any, onChange: (v: any) => void, label: string }) => {
  const schedule = parseSchedule(value);

  const updateDay = (index: number, field: string, val: any) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: val };
    onChange(newSchedule);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 block mb-2">{label}</label>
      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
        {schedule.map((slot: any, idx: number) => (
          <div key={slot.day} className="flex items-center space-x-4">
            <div className="w-24 text-sm font-medium text-slate-700">{slot.day}</div>
            <label className="flex items-center space-x-2 w-28 cursor-pointer">
              <input type="checkbox" checked={!slot.closed} onChange={e => updateDay(idx, 'closed', !e.target.checked)} className="text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span className="text-sm text-slate-600">{slot.closed ? 'Geschlossen' : 'Geöffnet'}</span>
            </label>
            {!slot.closed && (
              <div className="flex items-center space-x-2">
                <input type="time" value={slot.open} onChange={e => updateDay(idx, 'open', e.target.value)} className="border border-slate-300 rounded p-1 text-sm outline-none focus:border-blue-500" />
                <span className="text-sm text-slate-500">bis</span>
                <input type="time" value={slot.close} onChange={e => updateDay(idx, 'close', e.target.value)} className="border border-slate-300 rounded p-1 text-sm outline-none focus:border-blue-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const TagInput = ({ value, onChange, label, placeholder }: { value: string, onChange: (v: string) => void, label: string, placeholder: string }) => {
  const [inputValue, setInputValue] = useState('');
  
  const tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];

  const addTag = () => {
    const val = inputValue.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val].join(', '));
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove).join(', '));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 block">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full border border-blue-200">
            <span>{tag}</span>
            <button type="button" onClick={() => removeTag(tag)} className="hover:bg-blue-200 rounded-full p-0.5 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <input 
          type="text" 
          value={inputValue} 
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
          placeholder={placeholder}
          className="flex-1 border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button type="button" onClick={addTag} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">Hinzufügen</button>
      </div>
    </div>
  );
};

export const BusinessSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [facts, setFacts] = useState<BusinessFacts | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [magicUrl, setMagicUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      fetch('/api/business-facts', {
        headers: { 'Authorization': `Bearer ${data.session?.access_token}` }
      })
      .then(res => res.json())
      .then(data => {
        setFacts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load facts:', err);
        setLoading(false);
      });
    });
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!facts) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/business-facts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session?.access_token}`
        },
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

  const handleMagicFill = async () => {
    if (!magicUrl || !facts) return;
    setIsScraping(true);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/scrape-business', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session?.access_token}`
        },
        body: JSON.stringify({ url: magicUrl })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setFacts(prev => {
          if(!prev) return prev;
          return {
            ...prev,
            businessName: json.data.businessName || json.data.dealershipName || prev.businessName,
            address: json.data.address || prev.address,
            phone: json.data.phone || prev.phone,
            email: json.data.email || prev.email,
            emergencyNumber: json.data.emergencyNumber || prev.emergencyNumber,
            products: json.data.products || json.data.brands || prev.products,
            services: json.data.services || prev.services,
            pricing: json.data.pricing || json.data.rentalRates || prev.pricing,
            specialOffers: json.data.specialOffers || prev.specialOffers,
            openingHours: json.data.openingHours?.length ? json.data.openingHours : prev.openingHours,
            secondaryHours: json.data.secondaryHours?.length ? json.data.secondaryHours : (json.data.workshopHours?.length ? json.data.workshopHours : prev.secondaryHours)
          };
        });
        setMagicUrl('');
      } else {
        alert("Fehler beim Extrahieren der Daten.");
      }
    } catch (err) {
      console.error(err);
      alert("Ein Fehler ist aufgetreten.");
    } finally {
      setIsScraping(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Allgemeine Informationen', icon: Building2 },
    { id: 'hours', label: 'Öffnungszeiten', icon: Clock },
    { id: 'services', label: 'Dienstleistungen', icon: Wrench },
    { id: 'employees', label: 'Mitarbeiter', icon: Users },
    { id: 'appointment-rules', label: 'Terminregeln', icon: CalendarDays },
    { id: 'knowledge-base', label: 'Wissensdatenbank', icon: BookOpen },
    { id: 'permissions', label: 'Befugnisse', icon: ShieldCheck },
    { id: 'ai-behavior', label: 'KI-Verhalten', icon: Bot },
    { id: 'integrations', label: 'API & Integrationen', icon: Network },
  ];

  if (loading || !facts) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        <div className="animate-pulse">Lade Geschäftsdaten...</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            
            {/* MAGIC FILL UI */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Wand2 className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900">Magic Fill (KI)</h4>
                  <p className="text-xs text-blue-800 mt-1">Lass die KI deine Unternehmensdaten automatisch von deiner Website auslesen.</p>
                  <p className="text-[11px] text-blue-600 mt-0.5 font-medium">Tipp: Am besten nutzt du die URL deiner Startseite oder des Impressums, da dort meist alle Daten stehen.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="url" 
                  value={magicUrl}
                  onChange={e => setMagicUrl(e.target.value)}
                  placeholder="https://www.mein-unternehmen.de/impressum" 
                  className="flex-1 border border-blue-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                />
                <button 
                  onClick={handleMagicFill}
                  disabled={isScraping || !magicUrl}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  <span>{isScraping ? 'Analysiere...' : 'Ausfüllen'}</span>
                </button>
              </div>
            </div>

            <hr className="border-slate-200" />

            <div className="space-y-4">
              <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Name des Unternehmens</label>
              <input type="text" value={facts.businessName} onChange={e => setFacts({ ...facts, businessName: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Vollständige Adresse</label>
              <input type="text" value={facts.address} onChange={e => setFacts({ ...facts, address: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Telefonzentrale</label>
                <input type="text" value={facts.phone} onChange={e => setFacts({ ...facts, phone: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Allgemeine E-Mail</label>
                <input type="email" value={facts.email} onChange={e => setFacts({ ...facts, email: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            </div>
          </div>
        );
      case 'hours':
        return (
          <div className="space-y-6">
            <WeeklySchedule 
              label="Öffnungszeiten Verkauf" 
              value={facts.openingHours} 
              onChange={val => setFacts({ ...facts, openingHours: val })} 
            />
            <WeeklySchedule 
              label="Zusätzliche Öffnungszeiten (z.B. Service/Support)" 
              value={facts.secondaryHours} 
              onChange={val => setFacts({ ...facts, secondaryHours: val })} 
            />
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Pannennotdienst / 24h-Hotline</label>
              <input type="text" value={facts.emergencyNumber} onChange={e => setFacts({ ...facts, emergencyNumber: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        );
      case 'services':
        return (
          <div className="space-y-6">
            <TagInput 
              label="Produkte & Marken" 
              placeholder="Marke/Produkt eingeben und Enter drücken..." 
              value={facts.products} 
              onChange={val => setFacts({ ...facts, products: val })} 
            />
            <TagInput 
              label="Dienstleistungen" 
              placeholder="Leistung eingeben und Enter drücken..." 
              value={facts.services} 
              onChange={val => setFacts({ ...facts, services: val })} 
            />
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Preisliste & Konditionen</label>
              <textarea rows={2} value={facts.pricing} onChange={e => setFacts({ ...facts, pricing: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="z.B. Herrenschnitt ab 20€ ODER Beratung ab 50€/Stunde..." />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Aktuelle Aktionen & Angebote</label>
              <textarea rows={2} value={facts.specialOffers} onChange={e => setFacts({ ...facts, specialOffers: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        );
      case 'employees':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Mitarbeiter & Ansprechpartner (Kern-Team)</label>
              <p className="text-xs text-slate-500 mb-2">Hinterlegen Sie hier wichtige Personen, damit Lisa weiß, wer zuständig ist, wenn Kunden danach fragen.</p>
              <textarea rows={4} value={facts.teamMembers} onChange={e => setFacts({ ...facts, teamMembers: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="z.B. Herr Müller (Leitung), Frau Schmidt (Verkauf)" />
            </div>
          </div>
        );
      case 'appointment-rules':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">Warum ist das wichtig?</h4>
                <p className="text-xs text-blue-800 mt-1">Hier definieren Sie die Rahmenbedingungen, unter denen Lisa Termine für Sie vereinbaren darf. Durch klare Regeln zu Dauer und Vorlaufzeit stellt Lisa sicher, dass Ihre Werkstatt-Auslastung realistisch geplant wird und keine unmöglichen Zeitfenster geblockt werden.</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Regeln für Terminbuchungen</label>
              <textarea rows={5} value={facts.appointmentRules} onChange={e => setFacts({ ...facts, appointmentRules: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="z.B. Vorlaufzeit für Termine: Mindestens 2 Tage. Beratung dauert 30 Minuten, Behandlung 2 Stunden..." />
            </div>
          </div>
        );
      case 'knowledge-base':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">Stärkung der Auskunftsfähigkeit (Wissensdatenbank)</h4>
                <p className="text-xs text-blue-800 mt-1">Hinterlegen Sie hier unternehmensspezifisches Expertenwissen, spezielle Prozessabläufe (wie z.B. Schlüsselrückgabe außerhalb der Geschäftszeiten) oder Antworten auf häufig gestellte Fragen (FAQs). Lisa nutzt diese Daten als verlässliche Quelle, um Kundenanliegen fachgerecht und präzise im ersten Kontakt zu klären, ohne Personal binden zu müssen.</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Firmenwissen & FAQs (Freitext)</label>
              <textarea rows={8} value={facts.knowledgeBase} onChange={e => setFacts({ ...facts, knowledgeBase: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Geben Sie hier alles ein, was Lisa zusätzlich über Ihr Unternehmen wissen sollte..." />
            </div>
          </div>
        );
      case 'permissions':
        return (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-emerald-900 text-sm">Befugnisse und Rechte</h4>
                <p className="text-xs text-emerald-800 mt-1">Legen Sie hier ganz genau fest, welche Informationen Lisa aktiv an Kunden weitergeben darf und welche konkreten Handlungen sie ausführen darf.</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" checked={facts.permissions?.mentionPrices || false} onChange={e => setFacts({ ...facts, permissions: { ...facts.permissions, mentionPrices: e.target.checked } })} className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <div>
                  <span className="block text-sm font-semibold text-slate-700">Preise & Angebote nennen</span>
                  <span className="block text-xs text-slate-500">Lisa darf konkrete Preise für Reparaturen, Mietwagen oder Aktionen aus der Datenbank nennen.</span>
                </div>
              </label>
              <label className="flex items-start space-x-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" checked={facts.permissions?.mentionEmployees || false} onChange={e => setFacts({ ...facts, permissions: { ...facts.permissions, mentionEmployees: e.target.checked } })} className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <div>
                  <span className="block text-sm font-semibold text-slate-700">Mitarbeiter namentlich nennen</span>
                  <span className="block text-xs text-slate-500">Lisa darf Namen von Ansprechpartnern, wie z.B. dem Werkstattleiter, nennen.</span>
                </div>
              </label>
              <label className="flex items-start space-x-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" checked={facts.permissions?.bookAppointments || false} onChange={e => setFacts({ ...facts, permissions: { ...facts.permissions, bookAppointments: e.target.checked } })} className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <div>
                  <span className="block text-sm font-semibold text-slate-700">Termine aktiv buchen</span>
                  <span className="block text-xs text-slate-500">Lisa darf nicht nur Termine vorschlagen, sondern diese auch fest in den Kalender eintragen.</span>
                </div>
              </label>
              <label className="flex items-start space-x-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" checked={facts.permissions?.technicalAdvice || false} onChange={e => setFacts({ ...facts, permissions: { ...facts.permissions, technicalAdvice: e.target.checked } })} className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <div>
                  <span className="block text-sm font-semibold text-slate-700">Technische Ratschläge geben</span>
                  <span className="block text-xs text-slate-500">Lisa darf erste technische Einschätzungen bei z.B. leuchtenden Warnlampen abgeben.</span>
                </div>
              </label>
            </div>
          </div>
        );
      case 'ai-behavior':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">KI-Guardrails & Tonalität</h4>
                <p className="text-xs text-blue-800 mt-1">Geben Sie Lisa einen eigenen Charakter und definieren Sie klare Leitplanken. Diese Verhaltensregeln bestimmen, wie formell oder locker sie spricht, und legen strikt fest, welche Zusagen sie niemals machen darf (z.B. Preisgarantien).</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1">Systemanweisungen & Rote Linien (Guardrails)</label>
              <textarea rows={6} value={facts.guardrailsPrompt} onChange={e => setFacts({ ...facts, guardrailsPrompt: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="z.B. Sei stets formell, nutze das 'Sie', verspreche niemals kostenlose Leistungen..." />
            </div>
          </div>
        );
      case 'integrations':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 flex gap-3">
              <Network className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-900 text-sm">Externe Datenbank & Webhooks (Live Sync)</h4>
                <p className="text-xs text-purple-800 mt-1">Verbinden Sie Lisa mit Ihrer bestehenden Unternehmenssoftware (z.B. CRM, ERP oder Buchungssystem). So kann Lisa Live-Verfügbarkeiten prüfen und neue Leads/Termine direkt in Ihr System übertragen.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h5 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">1. Live API (Verfügbarkeiten abfragen)</h5>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">API Endpoint URL</label>
                <input type="url" value={facts.externalApiUrl || ''} onChange={e => setFacts({ ...facts, externalApiUrl: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="https://api.mein-system.de/v1/availability" />
                <p className="text-xs text-slate-500 mt-1">Die URL, die Lisa bei Kundenanfragen (Mietwagen, Zimmer, etc.) anfunkt.</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Auth Token (Bearer)</label>
                <input type="password" value={facts.externalApiKey || ''} onChange={e => setFacts({ ...facts, externalApiKey: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Ihr geheimer API-Schlüssel" />
              </div>
            </div>

            <div className="space-y-4 mt-8">
              <h5 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">2. Webhooks (Leads & Termine empfangen)</h5>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Webhook Endpoint URL</label>
                <input type="url" value={facts.webhookUrl || ''} onChange={e => setFacts({ ...facts, webhookUrl: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="https://api.mein-system.de/v1/webhook/leads" />
                <p className="text-xs text-slate-500 mt-1">Dorthin sendet Lisa einen HTTP POST Request mit den generierten Lead-Daten (JSON).</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Webhook Secret / Auth Token</label>
                <input type="password" value={facts.webhookSecret || ''} onChange={e => setFacts({ ...facts, webhookSecret: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Token zur Absicherung der Webhooks" />
                <p className="text-xs text-slate-500 mt-1">Dieses Token wird im `Authorization: Bearer &lt;token&gt;` Header mitgesendet, damit Sie verifizieren können, dass die Anfrage sicher von Lisa stammt.</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Geschäft</h1>
          <p className="text-xs text-slate-500 mt-1">Hier verwalten Sie alles, was Lisa über Ihr Unternehmen weiß und wie sie agiert.</p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-sm font-medium text-emerald-600 flex items-center gap-1 animate-pulse">
              <Check className="w-4 h-4" /> Gespeichert
            </span>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Speichert...' : 'Änderungen speichern'}</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Einstellungen</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 bg-white overflow-y-auto">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-3 mb-6">
              <Settings2 className="w-6 h-6 text-slate-400" />
              <h2 className="text-xl font-bold text-slate-800">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
            </div>
            
            <form onSubmit={handleSave}>
              {renderContent()}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
