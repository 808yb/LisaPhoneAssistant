import React from 'react';
import { LeadCategory, LeadUrgency, LeadStatus } from '../../core/types';

export const getCategoryBadge = (category: LeadCategory) => {
  switch (category) {
    case 'workshop':
      return <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold tracking-wide uppercase">Werkstatt</span>;
    case 'sales':
      return <span className="px-2.5 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold tracking-wide uppercase">Vertrieb</span>;
    case 'test_drive':
      return <span className="px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-bold tracking-wide uppercase">Probefahrt</span>;
    case 'spare_parts':
      return <span className="px-2.5 py-0.5 rounded-full bg-teal-500 text-white text-[10px] font-bold tracking-wide uppercase">Teile</span>;
    case 'rental':
      return <span className="px-2.5 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold tracking-wide uppercase">Mietwagen</span>;
    default:
      return <span className="px-2.5 py-0.5 rounded-full bg-slate-500 text-white text-[10px] font-bold tracking-wide uppercase">Sonstiges</span>;
  }
};

export const getUrgencyBadge = (urgency: LeadUrgency) => {
  switch (urgency) {
    case 'high':
      return <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold tracking-wide uppercase animate-pulse">Dringend</span>;
    case 'normal':
      return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold tracking-wide uppercase">Normal</span>;
    case 'low':
      return <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold tracking-wide uppercase">Niedrig</span>;
  }
};

export const getStatusBadge = (status: LeadStatus) => {
  switch (status) {
    case 'new':
      return <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold tracking-wide uppercase">Neu</span>;
    case 'in_progress':
      return <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold tracking-wide uppercase">In Bearbeitung</span>;
    case 'callback_scheduled':
      return <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold tracking-wide uppercase">Rückruf</span>;
    case 'completed':
      return <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold tracking-wide uppercase">Abgeschlossen</span>;
  }
};
