import React, { useState, useEffect } from 'react';
import { Resource } from '../../../../core/types';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../../../core/supabaseClient';

interface ResourceModalProps {
  resource: Resource | null;
  businessId: string;
  onClose: () => void;
  onSave: () => void;
}

interface TemplateField {
  key: string;
  label: string;
}

interface ResourceTemplate {
  type: string;
  label: string;
  fields: TemplateField[];
}

export const ResourceModal: React.FC<ResourceModalProps> = ({ resource, businessId, onClose, onSave }) => {
  const [name, setName] = useState(resource?.name || '');
  const [type, setType] = useState(resource?.type || 'custom');
  const [status, setStatus] = useState(resource?.status || 'available');
  const [metadata, setMetadata] = useState<Record<string, any>>(resource?.metadata || {});
  
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [templates, setTemplates] = useState<ResourceTemplate[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/resource-templates', {
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        if (res.ok) {
          setTemplates(await res.json());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTemplates();
  }, []);

  // Handle template change
  useEffect(() => {
    if (!resource && type !== 'custom') {
      const template = templates.find(t => t.type === type);
      if (template) {
        const newMeta: Record<string, string> = {};
        template.fields.forEach(f => {
          newMeta[f.key] = '';
        });
        setMetadata(newMeta);
      }
    }
  }, [type, resource, templates]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      business_id: businessId,
      name,
      type,
      status,
      metadata
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (resource?.id) {
        await fetch(`/api/resources/${resource.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/resources', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
        });
      }
      onSave();
    } catch (err) {
      console.error('Error saving resource:', err);
    }
  };

  const addCustomField = () => {
    if (newKey.trim()) {
      setMetadata({ ...metadata, [newKey.trim()]: newValue.trim() });
      setNewKey('');
      setNewValue('');
    }
  };

  const removeField = (key: string) => {
    const updated = { ...metadata };
    delete updated[key];
    setMetadata(updated);
  };

  const updateField = (key: string, val: string) => {
    setMetadata({ ...metadata, [key]: val });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h3 className="font-bold text-slate-800 text-lg">
            {resource ? 'Ressource bearbeiten' : 'Neue Ressource anlegen'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <form id="resource-form" onSubmit={handleSave} className="space-y-4 text-sm">
            
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Name der Ressource *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="z.B. BMW 3er, Raum 204, Anwalt Dr. Müller..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kategorie / Template</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    disabled={!!resource} // Disable changing template on edit
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    {templates.map(t => (
                      <option key={t.type} value={t.type}>{t.label}</option>
                    ))}
                    <option value="custom">Individuell (Leeres Template)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="available">Verfügbar</option>
                    <option value="in_use">In Nutzung / Gebucht</option>
                    <option value="maintenance">Wartung / Blockiert</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="mb-3">
                <h4 className="font-semibold text-slate-800 text-sm">Zusatzattribute (Custom Fields)</h4>
                <p className="text-[11px] text-slate-500">Definiere beliebige Key-Value Paare. Lisa wird diese verstehen.</p>
              </div>

              <div className="space-y-2">
                {Object.entries(metadata).map(([key, val]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={key} 
                      readOnly 
                      className="w-1/3 bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-600" 
                    />
                    <input 
                      type="text" 
                      value={val} 
                      onChange={e => updateField(key, e.target.value)}
                      placeholder="Wert eingeben..."
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500" 
                    />
                    <button 
                      type="button" 
                      onClick={() => removeField(key)}
                      className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2 items-center p-3 bg-slate-50 border border-slate-200 rounded-xl border-dashed">
                <input 
                  type="text" 
                  value={newKey} 
                  onChange={e => setNewKey(e.target.value)}
                  placeholder="Neues Feld (z.B. 'Farbe')"
                  className="w-1/3 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500" 
                />
                <input 
                  type="text" 
                  value={newValue} 
                  onChange={e => setNewValue(e.target.value)}
                  placeholder="Wert (z.B. 'Rot')"
                  className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500" 
                  onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addCustomField(); } }}
                />
                <button 
                  type="button" 
                  onClick={addCustomField}
                  className="p-2 text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-lg font-medium flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
          >
            Abbrechen
          </button>
          <button 
            type="submit"
            form="resource-form"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Speichern
          </button>
        </div>

      </div>
    </div>
  );
};
