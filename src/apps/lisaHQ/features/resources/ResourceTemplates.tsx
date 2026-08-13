import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Save, X, PlusCircle } from 'lucide-react';
import { supabase } from '../../../../core/supabaseClient';

interface TemplateField {
  key: string;
  label: string;
}

interface ResourceTemplate {
  id: string;
  type: string;
  label: string;
  fields: TemplateField[];
  created_at?: string;
}

export const ResourceTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<ResourceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ResourceTemplate>>({});

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleEdit = (tmpl: ResourceTemplate) => {
    setEditingId(tmpl.id);
    setEditForm(JSON.parse(JSON.stringify(tmpl))); // deep copy
  };

  const handleAddNew = () => {
    setEditingId('new');
    setEditForm({ type: '', label: '', fields: [] });
  };

  const handleSave = async () => {
    if (!editForm.label || (!editForm.type && editingId === 'new')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      if (editingId === 'new') {
        await fetch('/api/resource-templates', {
          method: 'POST',
          headers,
          body: JSON.stringify(editForm)
        });
      } else {
        await fetch(`/api/resource-templates/${editingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ label: editForm.label, fields: editForm.fields })
        });
      }
      setEditingId(null);
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Vorlage wirklich löschen?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`/api/resource-templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const addField = () => {
    setEditForm({
      ...editForm,
      fields: [...(editForm.fields || []), { key: '', label: '' }]
    });
  };

  const updateField = (index: number, key: string, label: string) => {
    const newFields = [...(editForm.fields || [])];
    newFields[index] = { key, label };
    setEditForm({ ...editForm, fields: newFields });
  };

  const removeField = (index: number) => {
    const newFields = [...(editForm.fields || [])];
    newFields.splice(index, 1);
    setEditForm({ ...editForm, fields: newFields });
  };

  if (loading) return <div className="p-8 text-slate-500">Lade Vorlagen...</div>;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="bg-emerald-100 p-3 rounded-xl">
            <Package className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Ressourcen-Vorlagen</h1>
            <p className="text-sm text-slate-500 mt-1">Globale Templates für Branchen verwalten</p>
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Neue Vorlage</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Typ (Key)</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Anzeigename</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Felder</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {templates.map(tmpl => (
              <tr key={tmpl.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{tmpl.type}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{tmpl.label}</td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {tmpl.fields.map(f => f.label).join(', ') || '-'}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                  <button onClick={() => handleEdit(tmpl)} className="text-blue-600 hover:text-blue-900">
                    <Edit className="w-4 h-4 inline" />
                  </button>
                  <button onClick={() => handleDelete(tmpl.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  Keine Vorlagen gefunden. Bitte erste Vorlage anlegen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId === 'new' ? 'Neue Vorlage' : 'Vorlage bearbeiten'}
              </h2>
              <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Typ-Key</label>
                    <input 
                      type="text" 
                      value={editForm.type || ''}
                      onChange={e => setEditForm({...editForm, type: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                      disabled={editingId !== 'new'}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                      placeholder="z.B. lawyer"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Darf nur aus kleinen Buchstaben und Unterstrichen bestehen.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Anzeigename</label>
                    <input 
                      type="text" 
                      value={editForm.label || ''}
                      onChange={e => setEditForm({...editForm, label: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="z.B. Anwalt (Recht)"
                    />
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-800">Dynamische Felder</h3>
                    <button onClick={addField} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                      <PlusCircle className="w-4 h-4 mr-1" />
                      Feld hinzufügen
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {editForm.fields?.map((field, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={field.key}
                            onChange={e => updateField(idx, e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''), field.label)}
                            className="w-full border border-slate-300 rounded p-2 text-sm"
                            placeholder="Data-Key (z.B. specialty)"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={field.label}
                            onChange={e => updateField(idx, field.key, e.target.value)}
                            className="w-full border border-slate-300 rounded p-2 text-sm"
                            placeholder="Anzeigename (z.B. Fachgebiet)"
                          />
                        </div>
                        <button onClick={() => removeField(idx)} className="text-slate-400 hover:text-red-600 p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(!editForm.fields || editForm.fields.length === 0) && (
                      <p className="text-sm text-slate-500 text-center py-4">Keine zusätzlichen Felder definiert.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingId(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-slate-800 text-white font-medium hover:bg-slate-700 rounded-lg transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
