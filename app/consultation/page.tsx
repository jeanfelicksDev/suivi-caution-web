'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

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
    durations?: {
      en_traitement: number | null;
      a_la_signature: number | null;
      a_la_compta: number | null;
    }
  } | null>(null);

  const [visits, setVisits] = useState({ today: 0, total: 0 });

  // Tracer la visite au chargement (uniquement pour les visiteurs sans compte)
  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('caution_user');
    const method = isLoggedIn ? 'GET' : 'POST';
    fetch('/api/visits', { method })
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
    { id: 2, label: searchResult?.statut_text === 'Dossier suspendu' ? 'Suspendu' : 'En traitement', key: 'en_traitement' },
    { id: 3, label: 'A la Signature', key: 'a_la_signature' },
    { id: 4, label: 'A la compta', key: 'a_la_compta' },
    { id: 5, label: 'Chèque dispo' },
  ];

  const currentStep = searchResult?.statut_code || 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem', fontFamily: '"Inter", system-ui, sans-serif' }}>
      
      {/* Header & Stats */}
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0, color: '#1e293b', fontWeight: 800 }}>Suivre mon remboursement</h1>
        
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
        <form onSubmit={doSearch} className="search-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '50%', margin: '0 auto' }}>
          <div style={{ position: 'relative' }}>
            <Search size={22} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
            <input
              type="text"
              placeholder="N° de facture (ex: FI41601906)..."
              value={numFacture}
              onChange={e => setNumFacture(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3.5rem',
                fontSize: '1.25rem',
                fontFamily: 'inherit',
                fontWeight: 800,
                letterSpacing: '0.05em',
                color: '#1e293b',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                outline: 'none',
                textTransform: 'uppercase',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-consulter" style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '1rem',
            fontSize: '1.1rem',
            fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            width: '100%'
          }}>
            {loading ? <RefreshCw size={22} style={{ animation: 'spin 1.s linear infinite' }} /> : <Search size={22} />}
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
              Votre dossier <strong>{searchResult.data.num_facture_caution}</strong> est en ce moment <strong style={{ color: '#4f46e5', backgroundColor: '#eef2ff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{searchResult.statut_text}</strong>.
            </p>
          </div>

          {/* Timeline Schema */}
          <div className="timeline-container" style={{ position: 'relative', margin: '2rem 1rem 4rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Background Line */}
            <div className="timeline-bg-line" style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '6px', background: '#e2e8f0', transform: 'translateY(-50%)', zIndex: 1, borderRadius: '3px' }} />
            
            {/* Active Progress Line */}
            <div className="timeline-active-line" style={{ position: 'absolute', top: '50%', left: '0', height: '6px', background: currentStep >= 5 ? '#16a34a' : '#4f46e5', transform: 'translateY(-50%)', zIndex: 2, borderRadius: '3px', transition: 'all 0.5s ease',
              width: currentStep > 0 ? `${((currentStep - 1) / (steps.length - 1)) * 100}%` : '0%'
            }} />

            {steps.map((step, index) => {
              const passed = step.id <= currentStep;
              const active = step.id === currentStep;
              const isSuspStep = step.label === 'Suspendu';
              const isFinalStep = step.id === 5;
              const duration = step.key ? (searchResult.durations ? searchResult.durations[step.key as keyof typeof searchResult.durations] : null) : null;

              const getStepColor = () => {
                if (isSuspStep) return '#ef4444';
                if (isFinalStep && passed) return '#16a34a';
                return '#4f46e5';
              };
              const stepColor = getStepColor();

              const getBorderColor = () => {
                if (!passed) return '4px solid #e2e8f0';
                if (isSuspStep) return '4px solid #fecaca';
                if (isFinalStep) return '4px solid #bbf7d0';
                return '4px solid #c7d2fe';
              };

              const getShadowColor = () => {
                if (isSuspStep) return 'rgba(239, 68, 68, 0.2)';
                if (isFinalStep) return 'rgba(22, 163, 74, 0.25)';
                return 'rgba(79, 70, 229, 0.2)';
              };

              return (
                <div key={step.id} className="step-item" style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: passed ? stepColor : '#f8fafc',
                    border: getBorderColor(),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: active ? `0 0 0 4px ${getShadowColor()}` : 'none'
                  }}>
                    {passed && (isSuspStep ? <X size={16} color="white" /> : <CheckCircle2 size={16} color="white" />)}
                  </div>
                  <div className="step-label" style={{ 
                    position: 'absolute', top: '40px', 
                    fontSize: '0.8rem', fontWeight: passed ? 700 : 500, 
                    color: active ? stepColor : (passed ? '#1e293b' : '#94a3b8'),
                    whiteSpace: 'nowrap', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                  }}>
                    <span>{step.label}</span>
                    {duration !== null && (
                      <span style={{ 
                        fontSize: '0.65rem', 
                        background: active ? stepColor : (isSuspStep ? '#fecaca' : '#f1f5f9'), 
                        color: active ? 'white' : (isSuspStep ? '#dc2626' : '#64748b'), 
                        padding: '1px 6px', 
                        borderRadius: '10px',
                        marginTop: '4px',
                        fontWeight: 700
                      }}>
                        {duration} {duration > 1 ? 'jours' : 'jour'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </section>
      )}

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        @media (max-width: 640px) {
          .search-form {
            flex-direction: column;
          }
          .btn-consulter {
            width: 100%;
            justify-content: center;
          }
          .search-form {
            max-width: 100% !important;
          }
          .timeline-container {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3.5rem !important;
            padding-left: 2rem !important;
            margin-top: 3rem !important;
          }
          .timeline-bg-line {
            left: 16px !important;
            top: -10px !important;
            bottom: -10px !important;
            width: 6px !important;
            height: auto !important;
            transform: translateX(-50%) !important;
          }
          .timeline-active-line {
            left: 16px !important;
            top: -10px !important;
            width: 6px !important;
            transform: translateX(-50%) !important;
            height: ${currentStep > 0 ? `${((currentStep - 1) / (steps.length - 1)) * 100}%` : '0%'} !important;
            transition: height 0.5s ease;
          }
          .step-item {
            flex-direction: row !important;
            gap: 1.5rem !important;
            width: 100%;
          }
          .step-label {
            position: static !important;
            text-align: left !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </div>
  );
}
