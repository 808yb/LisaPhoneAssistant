import React from 'react';
import { User, Car } from 'lucide-react';
import { Customer } from '../../../../../core/types';

interface CallerSetupProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  isCallActive: boolean;
}

export const CallerSetup: React.FC<CallerSetupProps> = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  isCallActive
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs uppercase tracking-widest text-slate-600 font-bold">Anrufer wählen</h3>
        </div>
        <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono">
          {customers.length} Kunden
        </span>
      </div>

      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
        <button
          disabled={isCallActive}
          onClick={() => onSelectCustomer(null)}
          className={`w-full text-left p-3 rounded-xl border transition-all ${
            selectedCustomer === null
              ? 'bg-slate-200 border-slate-300 text-slate-900 shadow-sm'
              : 'bg-slate-50 border-slate-200 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
          } ${isCallActive ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-xs text-slate-900">❓ Unbekannter Neukunde</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200">0170 98765432</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Kein Datenbank-Eintrag. KI fragt aktiv nach Kontaktdaten.</p>
        </button>

        {customers.map(cust => {
          const isSelected = selectedCustomer?.id === cust.id;
          return (
            <button
              key={cust.id}
              disabled={isCallActive}
              onClick={() => onSelectCustomer(cust)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-slate-200 border-slate-300 text-slate-900 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
              } ${isCallActive ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-blue-700">{cust.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {cust.phone}
                </span>
              </div>

              <div className="flex items-center space-x-2 mt-1 text-[11px]">
                {cust.vehicle ? (
                  <span className="text-slate-600 flex items-center space-x-1">
                    <Car className="w-3 h-3 text-blue-600" />
                    <span>{cust.vehicle}</span>
                    {cust.licensePlate && <span className="text-slate-500 font-mono">({cust.licensePlate})</span>}
                  </span>
                ) : (
                  <span className="text-amber-600/90 font-medium">Reine Mietkundin</span>
                )}

                {cust.isKnownCustomer && (
                  <span className="text-[9px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-600 px-1.5 py-0.2 rounded border border-emerald-200">
                    Stammkunde
                  </span>
                )}
              </div>

              {cust.lastVisitReason && (
                <p className="text-[11px] text-slate-500 mt-1 truncate">
                  Letzter Besuch: <span className="text-slate-600">{cust.lastVisitReason}</span>
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
