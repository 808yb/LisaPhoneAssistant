import React, { useState } from 'react';
import { Users, Search, Car, Phone, Calendar, Shield, Tag, Plus, Check, Info, FileText } from 'lucide-react';
import { Customer } from '../../../../core/types';

interface CustomerDatabaseProps {
  customers: Customer[];
  onAddCustomer: (customer: Partial<Customer>) => void;
  onUpdateCustomer?: (id: number, customer: Partial<Customer>) => void;
  onSelectCustomerForCall: (customer: Customer) => void;
}

export const CustomerDatabase: React.FC<CustomerDatabaseProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onSelectCustomerForCall
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'known' | 'rental' | 'has_car'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [activeCustomerDetail, setActiveCustomerDetail] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAdditionalInfo, setEditAdditionalInfo] = useState('');

  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAdditionalInfo, setNewAdditionalInfo] = useState('');
  const [newReferenceId, setNewReferenceId] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newIsKnown, setNewIsKnown] = useState(true);
  const [newRentsFromUs, setNewRentsFromUs] = useState(false);

  const filteredCustomers = customers.filter(cust => {
    if (filterType === 'known' && !cust.isKnownCustomer) return false;
    if (filterType === 'rental' && !cust.rentsFromUs) return false;
    if (filterType === 'has_car' && !cust.hasResource) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cust.name.toLowerCase().includes(q);
      const matchPhone = cust.phone.includes(q);
      const matchAdditionalInfo = cust.additionalInfo?.toLowerCase().includes(q);
      const matchPlate = cust.referenceId?.toLowerCase().includes(q);
      const matchNotes = cust.notes?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchAdditionalInfo && !matchPlate && !matchNotes) return false;
    }
    return true;
  });

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    onAddCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      additionalInfo: newAdditionalInfo.trim() || null,
      referenceId: newReferenceId.trim() || null,
      isKnownCustomer: newIsKnown,
      rentsFromUs: newRentsFromUs,
      hasResource: !!newAdditionalInfo.trim(),
      notes: newNotes.trim() || null
    });

    setNewName('');
    setNewPhone('');
    setNewAdditionalInfo('');
    setNewReferenceId('');
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
            <h2 className="text-base font-semibold text-slate-900 tracking-wide">Kundenkartei</h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Zentrale Kundendatenbank. Bei eingehenden Anrufen gleicht die KI die Telefonnummer in Echtzeit ab und lädt Details & Historien-Kontext.
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
              placeholder="Name, Telefon, Zusatzinfos, ID..."
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
            <option value="has_car">Mit Zusatzinfos</option>
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

              {/* Additional info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-700 font-medium text-[11px]">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{cust.additionalInfo || 'Keine Zusatzinfos hinterlegt'}</span>
                </div>
                {cust.referenceId && (
                  <p className="text-slate-500 font-mono text-[10px] pl-5">
                    ID/Kennung: <span className="text-slate-700">{cust.referenceId}</span>
                  </p>
                )}
                {cust.lastVisitReason && (
                  <p className="text-slate-500 text-[10px] pl-5">
                    Letzter Kontakt: <span className="text-blue-700">{cust.lastVisitReason}</span>
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
                  <label className="text-slate-600 font-semibold block mb-1">Zusatzinfos (Fahrzeug, Details etc.)</label>
                  <input
                    type="text"
                    value={newAdditionalInfo}
                    onChange={e => setNewAdditionalInfo(e.target.value)}
                    placeholder="z.B. Kunde bevorzugt..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder-slate-600 focus:outline-none focus:border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-semibold block mb-1">ID / Kennung</label>
                  <input
                    type="text"
                    value={newReferenceId}
                    onChange={e => setNewReferenceId(e.target.value)}
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
              <div className="w-full mr-4">
                {isEditing ? (
                  <div className="space-y-2 w-full">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Name des Kunden"
                      className="font-semibold text-slate-900 text-base w-full border border-slate-300 rounded p-1 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder="Telefonnummer"
                      className="text-xs font-mono text-blue-700 w-full border border-slate-300 rounded p-1 focus:outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-slate-900 text-base">{activeCustomerDetail.name}</h3>
                    <p className="text-xs font-mono text-blue-700">{activeCustomerDetail.phone}</p>
                  </>
                )}
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
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">Zusatzinfos & Details</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editAdditionalInfo}
                    onChange={e => setEditAdditionalInfo(e.target.value)}
                    placeholder="Besondere Details, Zusatzinfos, etc."
                    className="w-full mt-1 border border-slate-300 rounded p-1.5 text-slate-800 focus:outline-none"
                  />
                ) : (
                  <p className="text-slate-800 font-medium">{activeCustomerDetail.additionalInfo || 'Keine Zusatzinfos'}</p>
                )}
                {!isEditing && activeCustomerDetail.referenceId && (
                  <p className="text-slate-600 font-mono">ID/Kennung: {activeCustomerDetail.referenceId}</p>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">Letzter Kontakt / Historie</span>
                <p className="text-blue-700">{activeCustomerDetail.lastVisitReason || 'Kein historischer Kontakt gelistet'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block flex justify-between items-center">
                  <span>Interne Kunden-Notiz für KI-Kontext</span>
                  {!isEditing && onUpdateCustomer && (
                    <button 
                      onClick={() => {
                        setIsEditing(true);
                        setEditName(activeCustomerDetail.name || '');
                        setEditPhone(activeCustomerDetail.phone || '');
                        setEditNotes(activeCustomerDetail.notes || '');
                        setEditAdditionalInfo(activeCustomerDetail.additionalInfo || '');
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Bearbeiten
                    </button>
                  )}
                </span>
                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    <textarea
                      rows={3}
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="z.B. reiner Mietkunde..."
                      className="w-full border border-slate-300 rounded p-2 text-slate-800 focus:outline-none"
                    />
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 font-medium text-xs"
                      >
                        Abbrechen
                      </button>
                      <button 
                        onClick={() => {
                          if (onUpdateCustomer && activeCustomerDetail.id) {
                            onUpdateCustomer(activeCustomerDetail.id, {
                              ...activeCustomerDetail,
                              name: editName.trim(),
                              phone: editPhone.trim(),
                              notes: editNotes.trim(),
                              additionalInfo: editAdditionalInfo.trim() || null
                            });
                            setActiveCustomerDetail({
                              ...activeCustomerDetail,
                              name: editName.trim(),
                              phone: editPhone.trim(),
                              notes: editNotes.trim(),
                              additionalInfo: editAdditionalInfo.trim() || null
                            });
                            setIsEditing(false);
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs"
                      >
                        Speichern
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-700 leading-relaxed">{activeCustomerDetail.notes || 'Keine spezifischen Kundenhinweise.'}</p>
                )}
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
