import React, { useState, useEffect } from 'react';
import { Building2, Save, Plus, Trash2, Wand2, RefreshCw, Globe, Briefcase } from 'lucide-react';
import { supabase } from '../../../../core/supabaseClient';

interface Business {
  id: string;
  name: string;
}

interface CustomNode {
  tag: string;
  description: string;
  texts: string[];
}

interface FillerCategory {
  id: string;
  category: string;
  keywords: string;
  texts: string[];
}

interface GlobalScripts {
  core_greeting: string[];
  core_ai_disclosure: string[];
  core_farewell: string[];
  fillers?: FillerCategory[];
}

interface ScriptObj {
  custom_nodes: CustomNode[];
}

export const ScriptBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'global' | 'business'>('global');
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  
  const [globalScripts, setGlobalScripts] = useState<GlobalScripts | null>(null);
  const [scriptObj, setScriptObj] = useState<ScriptObj | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchBusinesses();
    fetchGlobalScripts();
  }, []);

  useEffect(() => {
    if (selectedBusinessId && activeTab === 'business') {
      fetchScript(selectedBusinessId);
    }
  }, [selectedBusinessId, activeTab]);

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': session ? `Bearer ${session.access_token}` : ''
    };
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/businesses', { headers: await getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data);
        if (data.length > 0 && !selectedBusinessId) {
          setSelectedBusinessId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch businesses', err);
    }
    setLoading(false);
  };

  const fetchGlobalScripts = async () => {
    try {
      const res = await fetch('/api/admin/global-scripts', { headers: await getHeaders() });
      if (res.ok) {
        setGlobalScripts(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch global scripts', err);
    }
  };

  const fetchScript = async (bizId: string) => {
    setScriptLoading(true);
    try {
      const res = await fetch(`/api/admin/scripts/${bizId}`, { headers: await getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setScriptObj({ custom_nodes: data.custom_nodes || [] });
      }
    } catch (err) {
      console.error('Failed to fetch script', err);
    }
    setScriptLoading(false);
  };

  const handleGlobalChange = (key: keyof GlobalScripts, index: number, value: string) => {
    if (!globalScripts) return;
    const newArr = [...(globalScripts[key] || [])];
    newArr[index] = value;
    setGlobalScripts({ ...globalScripts, [key]: newArr });
    setSaveSuccess(false);
  };

  const addGlobalVariation = (key: keyof GlobalScripts) => {
    if (!globalScripts) return;
    setGlobalScripts({ ...globalScripts, [key]: [...(globalScripts[key] || []), ''] });
    setSaveSuccess(false);
  };

  const removeGlobalVariation = (key: keyof GlobalScripts, index: number) => {
    if (!globalScripts) return;
    const newArr = [...(globalScripts[key] || [])];
    if (newArr.length > 1) {
      newArr.splice(index, 1);
      setGlobalScripts({ ...globalScripts, [key]: newArr });
      setSaveSuccess(false);
    }
  };

  const addFillerCategory = () => {
    if (!globalScripts) return;
    const newFiller: FillerCategory = { id: 'f-' + Date.now(), category: 'Neue Kategorie', keywords: '', texts: ['Ein Moment bitte...'] };
    setGlobalScripts({ ...globalScripts, fillers: [...(globalScripts.fillers || []), newFiller] });
    setSaveSuccess(false);
  };

  const updateFillerField = (index: number, field: keyof FillerCategory, value: string) => {
    if (!globalScripts) return;
    const newFillers = [...(globalScripts.fillers || [])];
    newFillers[index] = { ...newFillers[index], [field]: value };
    setGlobalScripts({ ...globalScripts, fillers: newFillers });
    setSaveSuccess(false);
  };

  const updateFillerText = (catIndex: number, textIndex: number, value: string) => {
    if (!globalScripts) return;
    const newFillers = [...(globalScripts.fillers || [])];
    const newTexts = [...newFillers[catIndex].texts];
    newTexts[textIndex] = value;
    newFillers[catIndex] = { ...newFillers[catIndex], texts: newTexts };
    setGlobalScripts({ ...globalScripts, fillers: newFillers });
    setSaveSuccess(false);
  };

  const addFillerText = (catIndex: number) => {
    if (!globalScripts) return;
    const newFillers = [...(globalScripts.fillers || [])];
    newFillers[catIndex].texts.push('');
    setGlobalScripts({ ...globalScripts, fillers: newFillers });
    setSaveSuccess(false);
  };

  const removeFillerText = (catIndex: number, textIndex: number) => {
    if (!globalScripts) return;
    const newFillers = [...(globalScripts.fillers || [])];
    if (newFillers[catIndex].texts.length > 1) {
      newFillers[catIndex].texts.splice(textIndex, 1);
      setGlobalScripts({ ...globalScripts, fillers: newFillers });
      setSaveSuccess(false);
    }
  };

  const removeFillerCategory = (index: number) => {
    if (!globalScripts) return;
    const newFillers = [...(globalScripts.fillers || [])];
    newFillers.splice(index, 1);
    setGlobalScripts({ ...globalScripts, fillers: newFillers });
    setSaveSuccess(false);
  };

  const addCustomNode = () => {
    if (!scriptObj) return;
    const newNode: CustomNode = { tag: 'NEUE_INFO', description: 'Kurze Beschreibung', texts: ['Neuer Text'] };
    setScriptObj({ ...scriptObj, custom_nodes: [...(scriptObj.custom_nodes || []), newNode] });
    setSaveSuccess(false);
  };

  const updateCustomNode = (nodeIndex: number, field: keyof CustomNode, value: string) => {
    if (!scriptObj) return;
    const newNodes = [...(scriptObj.custom_nodes || [])];
    newNodes[nodeIndex] = { ...newNodes[nodeIndex], [field]: value };
    setScriptObj({ ...scriptObj, custom_nodes: newNodes });
    setSaveSuccess(false);
  };

  const handleCustomTextChange = (nodeIndex: number, textIndex: number, value: string) => {
    if (!scriptObj) return;
    const newNodes = [...(scriptObj.custom_nodes || [])];
    const newTexts = [...newNodes[nodeIndex].texts];
    newTexts[textIndex] = value;
    newNodes[nodeIndex] = { ...newNodes[nodeIndex], texts: newTexts };
    setScriptObj({ ...scriptObj, custom_nodes: newNodes });
    setSaveSuccess(false);
  };

  const addCustomTextVariation = (nodeIndex: number) => {
    if (!scriptObj) return;
    const newNodes = [...(scriptObj.custom_nodes || [])];
    newNodes[nodeIndex].texts.push('');
    setScriptObj({ ...scriptObj, custom_nodes: newNodes });
    setSaveSuccess(false);
  };

  const removeCustomTextVariation = (nodeIndex: number, textIndex: number) => {
    if (!scriptObj) return;
    const newNodes = [...(scriptObj.custom_nodes || [])];
    if (newNodes[nodeIndex].texts.length > 1) {
      newNodes[nodeIndex].texts.splice(textIndex, 1);
      setScriptObj({ ...scriptObj, custom_nodes: newNodes });
      setSaveSuccess(false);
    }
  };

  const removeCustomNode = (nodeIndex: number) => {
    if (!scriptObj) return;
    const newNodes = [...(scriptObj.custom_nodes || [])];
    newNodes.splice(nodeIndex, 1);
    setScriptObj({ ...scriptObj, custom_nodes: newNodes });
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      if (activeTab === 'global' && globalScripts) {
        const res = await fetch(`/api/admin/global-scripts`, {
          method: 'POST',
          headers: await getHeaders(),
          body: JSON.stringify(globalScripts)
        });
        if (res.ok) setSaveSuccess(true);
      } else if (activeTab === 'business' && selectedBusinessId && scriptObj) {
        const res = await fetch(`/api/admin/scripts/${selectedBusinessId}`, {
          method: 'POST',
          headers: await getHeaders(),
          body: JSON.stringify(scriptObj)
        });
        if (res.ok) setSaveSuccess(true);
      }
      if (saveSuccess) setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save scripts', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-500 flex items-center justify-center p-12"><RefreshCw className="w-6 h-6 animate-spin" /></div>;
  }

  const renderGlobalSection = (title: string, key: keyof GlobalScripts, description: string) => {
    if (!globalScripts) return null;
    const variations = globalScripts[key] || [];
    
    return (
      <div className="border border-slate-200 rounded-xl p-5 relative bg-white mb-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          </div>
          <button 
            onClick={() => addGlobalVariation(key)}
            className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            Variation hinzufügen
          </button>
        </div>
        <div className="space-y-3">
          {variations.map((text, idx) => (
            <div key={idx} className="flex gap-2">
              <div className="bg-slate-100 text-slate-400 text-xs font-bold w-6 h-6 rounded flex items-center justify-center shrink-0 mt-2">
                {idx + 1}
              </div>
              <textarea 
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                rows={2}
                value={text}
                onChange={(e) => handleGlobalChange(key, idx, e.target.value)}
                placeholder="Text eingeben..."
              />
              {variations.length > 1 && (
                <button 
                  onClick={() => removeGlobalVariation(key, idx)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-2 shrink-0 mt-1"
                  title="Variation löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFillersSection = () => {
    if (!globalScripts) return null;
    const fillers = globalScripts.fillers || [];

    return (
      <div className="mt-8 border-t border-slate-200 pt-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Lückenfüller (Fillers)</h2>
            <p className="text-sm text-slate-500 mt-1">Automatische Zwischenantworten (z.B. "Einen Moment bitte...") zur Überbrückung der Ladezeit.</p>
          </div>
          <button 
            onClick={addFillerCategory}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Kategorie hinzufügen
          </button>
        </div>

        <div className="space-y-6">
          {fillers.map((filler, catIdx) => (
            <div key={filler.id} className="border-2 border-slate-200 rounded-xl p-5 relative bg-white shadow-sm">
              <button 
                onClick={() => removeFillerCategory(catIdx)}
                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 hover:bg-red-50"
                title="Kategorie löschen"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              
              <div className="grid grid-cols-2 gap-4 mb-4 pr-10">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kategorie Name</label>
                  <input 
                    type="text" 
                    value={filler.category}
                    onChange={e => updateFillerField(catIdx, 'category', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="z.B. Termin suchen"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Auslöser (Keywords, kommagetrennt)</label>
                  <input 
                    type="text" 
                    value={filler.keywords}
                    onChange={e => updateFillerField(catIdx, 'keywords', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="z.B. termin, beratung. Leer oder * = Standard-Lückenfüller"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 mt-4">
                  <label className="block text-xs font-semibold text-slate-600">Text-Variationen</label>
                  <button onClick={() => addFillerText(catIdx)} className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Variation hinzufügen
                  </button>
                </div>
                <div className="space-y-2">
                  {filler.texts.map((text, textIdx) => (
                    <div key={textIdx} className="flex gap-2">
                      <input 
                        type="text"
                        value={text}
                        onChange={e => updateFillerText(catIdx, textIdx, e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Text eingeben..."
                      />
                      {filler.texts.length > 1 && (
                        <button 
                          onClick={() => removeFillerText(catIdx, textIdx)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-2 shrink-0"
                          title="Variation löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {fillers.length === 0 && (
            <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500">
              Noch keine Lückenfüller angelegt.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Wand2 className="w-6 h-6 text-blue-600" />
          Universal Script Builder
        </h1>
        
        <div className="flex bg-slate-100 p-1 rounded-lg w-max mb-6">
          <button
            onClick={() => { setActiveTab('global'); setSaveSuccess(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'global' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe className="w-4 h-4" />
            Globale Basis-Skripte
          </button>
          <button
            onClick={() => { setActiveTab('business'); setSaveSuccess(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'business' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Unternehmensspezifisch
          </button>
        </div>
      </div>

      <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="font-semibold text-slate-800">
                {activeTab === 'global' ? 'Basis-Skripte bearbeiten (Für alle)' : 'Zusatz-Skripte (Branchenspezifisch)'}
              </h2>
              <p className="text-sm text-slate-500">Audio wird beim Speichern automatisch generiert.</p>
            </div>
            {activeTab === 'business' && businesses.length > 0 && (
              <div className="w-64 border-l pl-6 border-slate-200">
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm"
                    value={selectedBusinessId || ''}
                    onChange={(e) => { setSelectedBusinessId(e.target.value); setSaveSuccess(false); }}
                  >
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={handleSave}
            disabled={saving || (activeTab === 'business' && (!selectedBusinessId || !scriptObj)) || (activeTab === 'global' && !globalScripts)}
            className={`px-4 py-2 rounded-lg font-medium text-white shadow-sm flex items-center gap-2 transition-colors ${
              saving ? 'bg-slate-400 cursor-wait' : 
              saveSuccess ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Wird gespeichert...' : saveSuccess ? 'Gespeichert!' : 'Speichern & TTS generieren'}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'global' ? (
            <div>
              <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 flex gap-3">
                <Globe className="w-5 h-5 shrink-0 text-blue-600" />
                <div>
                  <p className="font-semibold mb-1">Globale Platzhalter nutzen</p>
                  <p>Du kannst in diesen Texten den Platzhalter <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold text-blue-900">{`{business_name}`}</code> verwenden. Die KI ersetzt dies automatisch bei Anrufen mit dem Namen des jeweiligen Unternehmens!</p>
                </div>
              </div>
              
              {renderGlobalSection("Begrüßung", "core_greeting", "Wird ganz am Anfang des Gesprächs gesagt.")}
              {renderGlobalSection("KI-Hinweis (Pflicht)", "core_ai_disclosure", "Hinweis, dass der Anrufer mit einer KI spricht und Daten nur für das Anliegen notiert werden.")}
              {renderGlobalSection("Verabschiedung", "core_farewell", "Wird am Ende des Gesprächs gesagt.")}
              {renderFillersSection()}
            </div>
          ) : (
            <div>
              {(!scriptObj || scriptLoading) ? (
                <div className="flex justify-center p-12"><RefreshCw className="w-6 h-6 animate-spin text-slate-400" /></div>
              ) : (
                <>
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-bold text-slate-700">Zusätzliche Informationen (Branchenspezifisch)</h2>
                      <p className="text-sm text-slate-500">Füge spezifische Fragen oder Hinweise hinzu, die die KI für DIESES Unternehmen nutzen soll.</p>
                    </div>
                    <button 
                      onClick={addCustomNode}
                      className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Info-Block hinzufügen
                    </button>
                  </div>

                  <div className="space-y-6">
                    {(scriptObj.custom_nodes || []).map((node, nIdx) => (
                      <div key={nIdx} className="border-2 border-indigo-100 rounded-xl p-5 relative bg-white shadow-sm">
                        <div className="absolute top-4 right-4">
                          <button 
                            onClick={() => removeCustomNode(nIdx)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-50 rounded-lg"
                            title="Block komplett löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4 pr-12">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Interner Tag</label>
                            <input 
                              type="text" 
                              value={node.tag}
                              onChange={e => updateCustomNode(nIdx, 'tag', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="z.B. ASK_ROOM_TYPE"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bedeutung / Anweisung</label>
                            <input 
                              type="text" 
                              value={node.description}
                              onChange={e => updateCustomNode(nIdx, 'description', e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder="Was soll die KI hier tun?"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Gesprochene Sätze (Variationen)</label>
                            <button 
                              onClick={() => addCustomTextVariation(nIdx)}
                              className="text-indigo-600 text-xs font-medium flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Satz hinzufügen
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {node.texts.map((text, tIdx) => (
                              <div key={tIdx} className="flex gap-2">
                                <textarea 
                                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50"
                                  rows={1}
                                  value={text}
                                  onChange={(e) => handleCustomTextChange(nIdx, tIdx, e.target.value)}
                                  placeholder="Genauer Satz, den die KI sprechen soll..."
                                />
                                {node.texts.length > 1 && (
                                  <button 
                                    onClick={() => removeCustomTextVariation(nIdx, tIdx)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-2 shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {(scriptObj.custom_nodes || []).length === 0 && (
                      <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                        Noch keine branchenspezifischen Infos angelegt.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
