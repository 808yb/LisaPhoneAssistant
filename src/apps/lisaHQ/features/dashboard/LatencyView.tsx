import React, { useState, useEffect } from 'react';
import { BarChart2 } from 'lucide-react';

interface Metrics {
  gemini: { average: number; latest: number };
  tts: { average: number; latest: number };
  db: { average: number; latest: number };
  twilio: { average: number; latest: number };
  totalAverage: number;
}

export const LatencyView: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/metrics/latency');
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error('Failed to fetch metrics', err);
      }
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalLatency = metrics?.totalAverage || 0;
  let latencyColor = 'text-blue-600';
  if (totalLatency > 0) {
    if (totalLatency < 800) { latencyColor = 'text-emerald-600'; }
    else if (totalLatency < 2000) { latencyColor = 'text-amber-600'; }
    else { latencyColor = 'text-red-600'; }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8 max-w-7xl">
      <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
        <BarChart2 className="w-6 h-6 text-indigo-600" />
        <h2 className="text-lg font-bold text-slate-800">Systemlatenz Details</h2>
      </div>
      
      {metrics ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <LatencyCard title="Gemini AI" stats={metrics.gemini} threshold={1000} />
            <LatencyCard title="Google TTS" stats={metrics.tts} threshold={500} />
            <LatencyCard title="Datenbank (Supabase)" stats={metrics.db} threshold={100} />
            <LatencyCard title="Twilio (API)" stats={metrics.twilio} threshold={400} />
          </div>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex justify-between items-center mt-8">
            <div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Gesamtlatenz (Ø)</div>
              <div className={`text-3xl font-bold mt-1 ${latencyColor}`}>{totalLatency} ms</div>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>Wird alle 3 Sekunden aktualisiert.</p>
              <p>Durchschnitt über die letzten 10 Anfragen.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-slate-500 text-center py-8">Lade Metriken...</div>
      )}
    </div>
  );
};

const LatencyCard = ({ title, stats, threshold }: { title: string, stats: {average: number, latest: number}, threshold: number }) => {
  const isHigh = stats.average > threshold;
  const isWarning = stats.average > threshold * 0.7 && !isHigh;
  const colorClass = isHigh ? 'text-red-600' : (isWarning ? 'text-amber-500' : 'text-emerald-600');
  const bgClass = isHigh ? 'bg-red-500' : (isWarning ? 'bg-amber-400' : 'bg-emerald-500');

  return (
    <div className="border border-slate-200 rounded-lg p-5">
      <h3 className="font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Durchschnitt</span>
            <span className={`font-bold ${colorClass}`}>{stats.average} ms</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className={`h-2 rounded-full ${bgClass}`} style={{ width: `${Math.min(100, (stats.average / (threshold * 1.5)) * 100)}%` }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Letzter Aufruf</span>
            <span className="font-medium text-slate-700">{stats.latest} ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
