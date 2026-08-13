import React from 'react';
import { Search } from 'lucide-react';

interface LeadFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedUrgency: string;
  setSelectedUrgency: (urgency: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
}

export const LeadFilters: React.FC<LeadFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedUrgency,
  setSelectedUrgency,
  selectedStatus,
  setSelectedStatus
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        
        {/* Search Box */}
        <div className="relative md:col-span-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Name, Telefon oder Anfrage suchen ..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* Department Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400"
        >
          <option value="all">Alle Kategorien</option>
          <option value="service">Dienstleistung & Service</option>
          <option value="sales">Verkauf & Produkte</option>
          <option value="booking">Terminbuchung</option>
          <option value="support">Support & Hilfe</option>
          <option value="rental">Verleih & Miete</option>
          <option value="general">Sonstiges</option>
        </select>

        {/* Urgency Filter */}
        <select
          value={selectedUrgency}
          onChange={(e) => setSelectedUrgency(e.target.value)}
          className="bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400"
        >
          <option value="all">Alle Dringlichkeiten</option>
          <option value="high">HOCH (Dringend)</option>
          <option value="normal">Normal</option>
          <option value="low">Niedrig</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400"
        >
          <option value="all">Alle Status</option>
          <option value="new">NEU (Unbearbeitet)</option>
          <option value="in_progress">In Bearbeitung</option>
          <option value="callback_scheduled">Rückruf geplant</option>
          <option value="completed">Abgeschlossen</option>
        </select>

      </div>
    </div>
  );
};
