import React from 'react';
import { Radar, Circle, PhoneCall, Calendar as CalendarIcon, AlertTriangle, Building2 } from 'lucide-react';

export const FleetView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Betriebsstatus</h1>
          <p className="text-sm text-slate-500 mt-1">Echtzeit-Betriebsstatus aller Unternehmen auf der Plattform.</p>
        </div>
        <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full">
          Demnächst
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 opacity-75">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <span className="font-semibold text-slate-800">48 Unternehmen Online</span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Circle className="w-3 h-3 text-emerald-500 fill-emerald-500" />
              <span className="font-semibold text-slate-700">Unternehmen A</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
              <PhoneCall className="w-4 h-4" />
              <span>2 Live-Anrufe</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Circle className="w-3 h-3 text-emerald-500 fill-emerald-500" />
              <span className="font-semibold text-slate-700">Klinik B</span>
            </div>
            <span className="text-sm text-slate-500 font-medium px-3">Inaktiv</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border-l-4 border-l-amber-400">
            <div className="flex items-center space-x-3">
              <Circle className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span className="font-semibold text-slate-700">Dental Müller</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-amber-600 font-medium bg-amber-50 px-3 py-1 rounded-full">
              <AlertTriangle className="w-4 h-4" />
              <span>Kalender getrennt</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Circle className="w-3 h-3 text-emerald-500 fill-emerald-500" />
              <span className="font-semibold text-slate-700">Hotel Adler</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full">
              <CalendarIcon className="w-4 h-4" />
              <span>1 Buchung</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border-l-4 border-l-rose-400">
            <div className="flex items-center space-x-3">
              <Circle className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span className="font-semibold text-slate-700">Kanzlei C</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-rose-600 font-medium bg-rose-50 px-3 py-1 rounded-full">
              <AlertTriangle className="w-4 h-4" />
              <span>Twilio offline</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 opacity-75">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Heutige Anrufe</div>
          <div className="text-2xl font-bold text-slate-800">1.247</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Termine</div>
          <div className="text-2xl font-bold text-slate-800">382</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Annahmequote</div>
          <div className="text-2xl font-bold text-slate-800">97,8%</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Gesch. Umsatz</div>
          <div className="text-2xl font-bold text-slate-800">€31.400</div>
        </div>
      </div>

      <div className="mt-12 p-8 bg-blue-50 rounded-xl border border-blue-100 text-center">
        <Radar className="w-12 h-12 text-blue-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-blue-900">Dieser Bereich befindet sich im Aufbau</h3>
        <p className="text-blue-700 text-sm mt-2 max-w-md mx-auto">
          Dieses Dashboard gibt Ihnen bald einen Überblick über Ihren gesamten SaaS-Betrieb aus der Vogelperspektive, sodass Sie Probleme erkennen können, bevor die Kunden es tun.
        </p>
      </div>
    </div>
  );
};
