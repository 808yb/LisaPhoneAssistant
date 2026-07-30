import React, { useState } from 'react';
import { Users, Search, Car, Phone, Calendar, Shield, Tag, Plus, Check, Info, FileText } from 'lucide-react';
import { Customer } from '../types';

interface CustomerDatabaseProps {
  customers: Customer[];
  onAddCustomer: (customer: Partial<Customer>) => void;
  onSelectCustomerForCall: (customer: Customer) => void;
}

export const CustomerDatabase: React.FC<CustomerDatabaseProps> = ({
  customers,
  onAddCustomer,
  onSelectCustomerForCall
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'known' | 'rental' | 'has_car'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [activeCustomerDetail, setActiveCustomerDetail] = useState<Customer | null>(null);

  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newVehicle, setNewVehicle] = useState('');
  const [newLicensePlate, setNewLicensePlate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newIsKnown, setNewIsKnown] = useState(true);
  const [newRentsFromUs, setNewRentsFromUs] = useState(false);

  const filteredCustomers = customers.filter(cust => {
    if (filterType === 'known' && !cust.isKnownCustomer) return false;
    if (filterType === 'rental' && !cust.rentsFromUs) return false;
    if (filterType === 'has_car' && !cust.hasOwnCar) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cust.name.toLowerCase().includes(q);
      const matchPhone = cust.phone.includes(q);
      const matchVehicle = cust.vehicle?.toLowerCase().includes(q);
      const matchPlate = cust.licensePlate?.toLowerCase().includes(q);
      const matchNotes = cust.notes?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchVehicle && !matchPlate && !matchNotes) return false;
    }
    return true;
  });

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    onAddCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      vehicle: newVehicle.trim() || null,
      licensePlate: newLicensePlate.trim() || null,
      isKnownCustomer: newIsKnown,
      rentsFromUs: newRentsFromUs,
      hasOwnCar: !!newVehicle.trim(),
      notes: newNotes.trim() || null
    });

    setNewName('');
    setNewPhone('');
    setNewVehicle('');
    setNewLicensePlate('');
    setNewNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900 tracking-wide">Kundenkartei (Kaiserslautern)</h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Zentrale Kundendatenbank. Bei eingehenden Anrufen gleicht die KI die Telefonnummer in Echtzeit ab und lädt Fahrzeug- & Historien-Kontext.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 font-medium rounded-lg text-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Neuen Kunden Anlegen</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, Telefon, Fahrzeug, Kennzeichen..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-600 focus:outline-none focus:border-slate-300"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-slate-300"
          >
            <option value="all">Alle Kunden ({customers.length})</option>
            <option value="known">Stammkunden</option>
            <option value="rental">Mietkunden</option>
            <option value="has_car">Mit eigenem Fahrzeug</option>
          </select>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(cust => (
          <div
            key={cust.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-3 hover:border-slate-200 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{cust.name}</h3>
                  <p className="text-xs font-mono text-blue-700">{cust.phone}</p>
                </div>

                <div className="flex items-center space-x-1">
                  {cust.isKnownCustomer && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-600 border border-emerald-200 text-[9px] uppercase font-bold tracking-wider">
                      Stammkunde
                    </span>
                  )}
                  {cust.rentsFromUs && (
                    <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 border border-sky-200 text-[9px] uppercase font-bold tracking-wider">
                      Mietkunde
                    </span>
                  )}
                </div>
              </div>

              {/* Vehicle info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-700 font-medium text-[11px]">
                  <Car className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{cust.vehicle || 'Kein eignes Fahrzeug hinterlegt'}</span>
                </div>
                {cust.licensePlate && (
                  <p className="text-slate-500 font-mono text-[10px] pl-5">
                    Kennzeichen: <span className="text-slate-700">{cust.licensePlate}</span>
                  </p>
                )}
                {cust.lastVisitReason && (
                  <p className="text-slate-500 text-[10px] pl-5">
                    Letzter Grund: <span className="text-blue-700">{cust.lastVisitReason}</span>
                  </p>
                )}
              </div>

              {/* Notes preview */}
              {cust.notes && (
                <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-slate-50/50 p-2 rounded-lg border border-slate-200">
                  "{cust.notes}"
                </p>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <button
                onClick={() => setActiveCustomerDetail(cust)}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center space-x-1 font-medium"
              >
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Details & Historie</span>
              </button>

              <button
                onClick={() => onSelectCustomerForCall(cust)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-100 hover:bg-indigo-500/30 text-blue-700 hover:text-blue-800 rounded-lg text-xs font-medium border border-blue-200 transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>KI-Anruf starten</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-100/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-semibold text-slate-900 text-sm">Neuen Kunden Anlegen</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-900 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Voller Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="z.B. Max Mustermann"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder-slate-600 focus:outline-none focus:border-slate-300"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Telefonnummer *</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="z.B. 0151 12345678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder-slate-600 focus:outline-none focus:border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Fahrzeugmodell</label>
                  <input
                    type="text"
                    value={newVehicle}
                    onChange={e => setNewVehicle(e.target.value)}
                    placeholder="z.B. VW Passat 2021"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder-slate-600 focus:outline-none focus:border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Kennzeichen</label>
                  <input
                    type="text"
                    value={newLicensePlate}
                    onChange={e => setNewLicensePlate(e.target.value)}
                    placeholder="z.B. KL-MM 1234"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder-slate-600 focus:outline-none focus:border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-1">
                <label className="flex items-center space-x-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={newIsKnown}
                    onChange={e => setNewIsKnown(e.target.checked)}
                    className="rounded bg-slate-50 border-slate-200 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Stammkunde</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={newRentsFromUs}
                    onChange={e => setNewRentsFromUs(e.target.checked)}
                    className="rounded bg-slate-50 border-slate-200 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Mietkunde</span>
                </label>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Besondere Notizen</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Kundenwünsche, Fahrzeughistorie, Besonderheiten..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder-slate-600 focus:outline-none focus:border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium border border-slate-200"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 rounded-lg font-medium"
                >
                  Kunden Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail View Modal */}
      {activeCustomerDetail && (
        <div className="fixed inset-0 z-50 bg-slate-100/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">{activeCustomerDetail.name}</h3>
                <p className="text-xs font-mono text-blue-700">{activeCustomerDetail.phone}</p>
              </div>
              <button
                onClick={() => setActiveCustomerDetail(null)}
                className="text-slate-600 hover:text-slate-900 font-medium text-xs bg-slate-100 px-3 py-1 rounded-lg border border-slate-200"
              >
                Schließen
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">Fahrzeug & Kennzeichen</span>
                <p className="text-slate-800 font-medium">{activeCustomerDetail.vehicle || 'Kein Fahrzeug'}</p>
                {activeCustomerDetail.licensePlate && (
                  <p className="text-slate-600 font-mono">Kennzeichen: {activeCustomerDetail.licensePlate}</p>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">Historischer Besuchsgrund</span>
                <p className="text-blue-700">{activeCustomerDetail.lastVisitReason || 'Kein historischer Werkstattbesuch gelistet'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">Interne Kunden-Notiz für KI-Kontext</span>
                <p className="text-slate-700 leading-relaxed">{activeCustomerDetail.notes || 'Keine spezifischen Kundenhinweise.'}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => {
                  const cust = activeCustomerDetail;
                  setActiveCustomerDetail(null);
                  onSelectCustomerForCall(cust);
                }}
                className="w-full py-2 bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-800 font-medium rounded-lg text-center flex items-center justify-center space-x-2 text-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>KI-Anruf für diesen Kunden Starten</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
