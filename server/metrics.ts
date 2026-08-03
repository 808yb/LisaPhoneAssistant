export type ServiceName = 'gemini' | 'tts' | 'db' | 'twilio';

interface LatencyRecord {
  timestamp: number;
  duration: number;
}

class MetricsTracker {
  private latencies: Record<ServiceName, LatencyRecord[]> = {
    gemini: [],
    tts: [],
    db: [],
    twilio: []
  };

  private readonly MAX_HISTORY = 10;

  record(service: ServiceName, duration: number) {
    this.latencies[service].push({ timestamp: Date.now(), duration });
    if (this.latencies[service].length > this.MAX_HISTORY) {
      this.latencies[service].shift();
    }
  }

  getStats() {
    const stats: Record<string, any> = {};
    for (const service of Object.keys(this.latencies) as ServiceName[]) {
      const records = this.latencies[service];
      if (records.length === 0) {
        stats[service] = { average: 0, latest: 0 };
        continue;
      }
      
      const latest = Math.round(records[records.length - 1].duration);
      const sum = records.reduce((acc, r) => acc + r.duration, 0);
      const average = Math.round(sum / records.length);
      
      stats[service] = { average, latest };
    }
    
    // Total turnaround latency is roughly the sum of all services 
    // involved in a single turn (DB + Gemini + TTS).
    stats.totalAverage = (stats.gemini?.average || 0) + 
                         (stats.tts?.average || 0) + 
                         (stats.db?.average || 0);
    
    return stats;
  }
}

export const metrics = new MetricsTracker();
