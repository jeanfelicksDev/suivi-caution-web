'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, RefreshCw, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export default function ConsultationPage() {
  const [numFacture, setNumFacture] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    statut_code?: number;
    statut_text?: string;
    data?: any;
    error?: string;
  } | null>(null);

  const [visits, setVisits] = useState({ today: 0, total: 0 });

  // Tracer la visite au chargement
  useEffect(() => {
    fetch('/api/visits', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.today === 'number') {
          setVisits(data);
        }
      })
      .catch(err => console.error('Erreur stats', err));
  }, []);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numFacture.trim()) return;

    setLoading(true);
    setError(null);
    setSearchResult(null);
    try {
      const res = await fetch(`/api/suivi/${numFacture.trim()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSearchResult(data);
      if (!data.found && !data.error) {
        setError("Dossier introuvable.");
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: 'Réception' },
    { id: 2, label: 'En traitement' },
    { id: 3, label: 'A la Signature' },
    { id: 4, label: 'A la compta' },
    { id: 5, label: 'Chèque dispo' },
  ];

  const currentStep = searchResult?.statut_code || 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem', fontFamily: '"Inter", system-ui, sans-serif' }}>
      
      {/* Header & Stats */}
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#1e293b', fontWeight: 800 }}>Suivi Client</h1>
        
        <div style={{ display: 'flex', gap: '1rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', alignItems: 'center' }}>
          <Eye size={18} color="#64748b" />
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
            <span>Aujourd'hui : <strong style={{ color: '#0f172a' }}>{visits.today}</strong></span>
            <span>Total : <strong style={{ color: '#0f172a' }}>{visits.total}</strong></span>
          </div>
        </div>
      </div>

      {/* Search Box */}
      <section style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '1.5rem', borderRadius: '16px', borderTop: '4px solid #4f46e5', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '2rem' }}>
        <form onSubmit={doSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="N° de facture (ex: FI41601906)..."
              value={numFacture}
              onChange={e => setNumFacture(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.8rem',
                fontSize: '1.1rem',
                fontFamily: 'inherit',
                fontWeight: 600,
                letterSpacing: '0.05em',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                outline: 'none',
                textTransform: 'uppercase',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
              }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              required
            />
          </div>
          <button type="submit" disabled={loading} style={{
            background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s', whiteSpace: 'nowrap'
          }}>
            {loading ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={18} />}
            Consulter
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#fef2f2', color: '#ef4444', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}
      </section>

      {/* Result View */}
      {searchResult?.found && (
        <section style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#1e293b', fontWeight: 600, marginBottom: '0.75rem' }}>
              Cher client,
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
              votre dossier <strong>{searchResult.data.num_facture_caution}</strong> est en ce moment <strong style={{ color: '#4f46e5', backgroundColor: '#eef2ff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{searchResult.statut_text}</strong>.
            </p>
          </div>

          {/* Timeline Schema */}
          <div style={{ position: 'relative', margin: '2rem 2rem 4rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Background Line */}
            <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '6px', background: '#e2e8f0', transform: 'translateY(-50%)', zIndex: 1, borderRadius: '3px' }} />
            
            {/* Active Progress Line */}
            <div style={{ position: 'absolute', top: '50%', left: '0', height: '6px', background: '#4f46e5', transform: 'translateY(-50%)', zIndex: 2, borderRadius: '3px', transition: 'width 0.5s ease',
              width: currentStep > 0 ? `${((currentStep - 1) / (steps.length - 1)) * 100}%` : '0%'
            }} />

            {steps.map((step, index) => {
              const passed = step.id <= currentStep;
              const active = step.id === currentStep;

              return (
                <div key={step.id} style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: passed ? '#4f46e5' : '#f8fafc',
                    border: passed ? '4px solid #c7d2fe' : '4px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: active ? '0 0 0 4px rgba(79, 70, 229, 0.2)' : 'none'
                  }}>
                    {passed && <CheckCircle2 size={16} color="white" />}
                  </div>
                  <span style={{ 
                    position: 'absolute', top: '40px', 
                    fontSize: '0.8rem', fontWeight: passed ? 700 : 500, 
                    color: active ? '#4f46e5' : (passed ? '#1e293b' : '#94a3b8'),
                    whiteSpace: 'nowrap', textAlign: 'center'
                  }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>


        </section>
      )}

    </div>
  );
}
