import React, { useState } from 'react';
import { Lock, Mail, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../core/supabaseClient';

interface LoginProps {
  type: 'hq' | 'business';
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ type, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isHQ = type === 'hq';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authErr) throw authErr;

      // Check role
      const session = data.session;
      const meRes = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      
      const meData = await meRes.json();
      
      if (!meRes.ok) {
        await supabase.auth.signOut();
        throw new Error('Berechtigungsprüfung fehlgeschlagen.');
      }

      if (isHQ && meData.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Zugriff verweigert: Nur für Administratoren.');
      }

      if (!isHQ && meData.role !== 'business') {
        await supabase.auth.signOut();
        throw new Error('Zugriff verweigert: Nur für Business-Nutzer.');
      }

      onLogin();
    } catch (err: any) {
      setError(err.message || 'Ungültige Anmeldedaten.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative">
        
        {/* Decorative Top Bar */}
        <div className={`h-2 w-full ${isHQ ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}></div>

        <div className="p-8">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isHQ ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
              {isHQ ? <ShieldCheck className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              {isHQ ? 'LisaHQ Login' : 'Lisa Business Portal'}
            </h1>
            <p className="text-slate-500 text-sm mt-1 text-center">
              {isHQ ? 'Superadmin Bereich für Mandantenverwaltung' : 'Willkommen zurück! Bitte logge dich ein.'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail Adresse</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder={isHQ ? 'admin@lisahq.com' : 'demo@business.com'}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-2.5 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all hover:shadow-lg ${
                isHQ 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
              }`}
            >
              Anmelden
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-mono">
              Dummy Login: {isHQ ? 'admin@lisahq.com / admin123' : 'demo@business.com / demo123'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
