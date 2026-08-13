import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Filter, Info, Trash2, Edit } from 'lucide-react';
import { Resource } from '../../../../core/types';
import { ResourceModal } from './ResourceModal';
import { supabase } from '../../../../core/supabaseClient';

interface ResourceListProps {
  businessId: string;
}

export const ResourceList: React.FC<ResourceListProps> = ({ businessId }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [externalApiUrl, setExternalApiUrl] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. Fetch business facts to check for external API
      let hasExternal = false;
      const bfResponse = await fetch('/api/business-facts', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (bfResponse.ok) {
        const data = await bfResponse.json();
        if (data.externalApiUrl) {
          setExternalApiUrl(data.externalApiUrl);
          hasExternal = true;
        } else {
          setExternalApiUrl('');
        }
      }

      // 2. Fetch resources based on external API status
      const endpoint = hasExternal ? '/api/external-resources' : '/api/resources';
      const resResponse = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (resResponse.ok) {
        const data = await resResponse.json();
        setResources(data);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const handleDelete = async (id: number) => {
    if (!confirm('Ressource wirklich löschen?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`/api/resources/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      loadData();
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const handleStatusChange = async (id: number | string, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const endpoint = externalApiUrl ? '/api/external-resources/update' : `/api/resources/${id}`;
      const method = externalApiUrl ? 'POST' : 'PUT';
      const body = externalApiUrl ? JSON.stringify({ id, status: newStatus }) : JSON.stringify({ status: newStatus });

      const res = await fetch(endpoint, {
        method,
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body
      });
      if (res.ok) {
        loadData(); // Refresh UI after successful update
      } else {
        alert("Fehler beim Aktualisieren des Status.");
      }
    } catch (e) {
      console.error('Failed to update status:', e);
      alert("Netzwerkfehler beim Aktualisieren.");
    }
  };

  const filteredResources = resources.filter(res => {
    if (filterType !== 'all' && res.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !res.name.toLowerCase().includes(q) &&
        !res.type.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const uniqueTypes = Array.from(new Set(resources.map(r => r.type)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900 tracking-wide">Ressourcen & Inventar</h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Verwalte hier alle buchbaren Ressourcen (Fahrzeuge, Räume, Personal) mit flexiblen Metadaten.
          </p>
        </div>

        {!externalApiUrl && (
          <button
            onClick={() => {
              setEditingResource(null);
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 font-medium rounded-lg text-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Neue Ressource</span>
          </button>
        )}
      </div>

      {externalApiUrl && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3 shadow-sm">
          <Info className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-emerald-800 font-medium text-sm">Live-Sync ist aktiv</h3>
            <p className="text-emerald-700 text-xs mt-1">
              Lisa ruft Ihre Ressourcen in Echtzeit über Ihre externe API ab ({externalApiUrl}). 
              Bitte verwalten Sie Ihre Flotte direkt in Ihrem externen System. Diese interne Ansicht ist deaktiviert, solange Live-Sync aktiv ist.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name oder Typ suchen..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-600 focus:outline-none focus:border-slate-300"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-slate-300"
          >
            <option value="all">Alle Typen ({resources.length})</option>
            {uniqueTypes.map(t => (
              <option key={t as string} value={t as string}>{t as string}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-slate-500 text-sm">Lade Ressourcen...</div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
          Keine Ressourcen gefunden. Lege eine neue an.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(res => (
            <div key={res.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{res.name}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">{res.type}</p>
                </div>
                <select
                  value={res.status}
                  onChange={(e) => res.id && handleStatusChange(res.id, e.target.value)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none ${
                    res.status === 'available' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                    res.status === 'in_use' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <option value="available">Verfügbar</option>
                  <option value="in_use">In Nutzung / Gebucht</option>
                  <option value="maintenance">Wartung / Defekt</option>
                </select>
              </div>
              
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Details (JSON Metadata)</div>
                {Object.keys(res.metadata || {}).length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Keine Zusatzfelder definiert.</p>
                ) : (
                  Object.entries(res.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-[11px]">
                      <span className="text-slate-500">{key}:</span>
                      <span className="text-slate-800 font-medium truncate ml-2 max-w-[120px]">{String(value)}</span>
                    </div>
                  ))
                )}
              </div>

              {!externalApiUrl && (
                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setEditingResource(res);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => res.id && handleDelete(res.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ResourceModal 
          resource={editingResource}
          businessId={businessId}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

