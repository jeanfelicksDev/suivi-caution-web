'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, RefreshCw, CheckCircle2, AlertTriangle, X, ChevronRight, Info, Phone, Mail } from 'lucide-react';

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

  useEffect(() => {
    const isLoggedIn = !!sessionStorage.getItem('caution_user');
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

  const doSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
    { id: 1, label: 'Dossier Reçu', desc: 'Réception et scanning du dossier' },
    { id: 2, label: searchResult?.statut_text === 'Dossier suspendu' ? 'Dossier Suspendu' : 'Traitement', key: 'en_traitement', desc: 'Analyse et vérification' },
    { id: 3, label: 'Signature', key: 'a_la_signature', desc: 'Validation par la direction' },
    { id: 4, label: 'Comptabilité', key: 'a_la_compta', desc: 'Ordonnancement du virement' },
    { id: 5, label: 'Chèque / Virement Dispo', desc: 'Remboursement prêt à être récupéré' },
  ];

  const currentStep = searchResult?.statut_code || 0;

  return (
    <div className="mobile-app-container">
      {/* Background decoration */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      <div className="app-content">
        {/* Header Section */}
        <header className="app-header">
          <div className="logo-section">
            <img src="/logo-agl.png" alt="AGL Logo" className="agl-logo" />
            <div className="v-divider"></div>
            <h1 className="app-title">Suivi Caution</h1>
          </div>
          
          <div className="view-stats">
            <div className="stat-pill">
              <Eye size={14} />
              <span>{visits.today}</span>
            </div>
          </div>
        </header>

        {/* Hero / Search Section */}
        <section className={`search-section ${searchResult ? 'minimized' : ''}`}>
          {!searchResult && (
            <div className="welcome-text">
              <h2>Bienvenue, cher client</h2>
              <p>Consultez l'état d'avancement de votre remboursement en saisissant votre numéro de facture.</p>
            </div>
          )}

          <div className="glass-card search-card">
            <form onSubmit={doSearch} className="search-form">
              <div className="input-wrapper">
                <Search className={`search-icon ${loading ? 'animate-pulse' : ''}`} size={20} />
                <input
                  type="text"
                  placeholder="EX: FI41601906"
                  value={numFacture}
                  onChange={e => setNumFacture(e.target.value.toUpperCase())}
                  className="search-input"
                  required
                />
                {numFacture && !loading && (
                    <X size={18} className="clear-input" onClick={() => setNumFacture('')} />
                )}
              </div>
              <button type="submit" disabled={loading} className="btn-search">
                {loading ? <RefreshCw size={22} className="animate-spin" /> : <span>Consulter</span>}
              </button>
            </form>
          </div>

          {error && (
            <div className="error-badge">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* Result Area */}
        {searchResult?.found && (
          <main className="result-area animate-fade-in">
            {/* Status Overview */}
            <div className="glass-card status-card">
              <div className="status-header">
                <span className="facture-id">Dossier #{searchResult.data.num_facture_caution}</span>
                <div className={`status-badge ${searchResult.statut_text?.includes('suspendu') ? 'badge-red' : 'badge-green'}`}>
                  {searchResult.statut_text}
                </div>
              </div>
              <p className="client-name">{searchResult.data.client_nom}</p>
            </div>

            {/* Premium Timeline */}
            <div className="timeline-section">
              <h3 className="section-title">Progression du dossier</h3>
              <div className="timeline-vertical">
                {steps.map((step, index) => {
                  const isPassed = step.id <= currentStep;
                  const isActive = step.id === currentStep;
                  const isLast = index === steps.length - 1;
                  const isSuspended = step.label.includes('Suspendu');
                  const duration = step.key ? (searchResult.durations ? (searchResult.durations as any)[step.key] : null) : null;

                  return (
                    <div key={step.id} className={`timeline-item ${isPassed ? 'passed' : ''} ${isActive ? 'active' : ''}`}>
                      <div className="step-indicator">
                        <div className="step-node">
                          {isPassed ? (
                            isSuspended ? <X size={16} /> : <CheckCircle2 size={16} />
                          ) : (
                            <span className="step-num">{step.id}</span>
                          )}
                        </div>
                        {!isLast && <div className="step-connector"></div>}
                      </div>
                      
                      <div className="step-content">
                        <div className="step-header">
                          <span className="step-label">{step.label}</span>
                          {duration !== null && (
                            <span className="step-duration">{duration}j</span>
                          )}
                        </div>
                        <p className="step-desc">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions / Info */}
            <div className="glass-card info-card">
              <h3>Besoin d'aide ?</h3>
              <div className="contact-grid">
                <a href="tel:+22500000000" className="contact-item">
                  <div className="icon-box"><Phone size={18} /></div>
                  <span>Appeler le service client</span>
                </a>
                <a href="mailto:support@agl.com" className="contact-item">
                  <div className="icon-box"><Mail size={18} /></div>
                  <span>Envoyer un email</span>
                </a>
              </div>
            </div>
          </main>
        )}
      </div>

      <style jsx>{`
        .mobile-app-container {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Outfit', sans-serif;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 3rem;
        }

        .bg-blob {
          position: fixed;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          opacity: 0.15;
        }
        .blob-1 { top: -100px; right: -100px; background: #1D3557; }
        .blob-2 { bottom: -100px; left: -100px; background: #457B9D; }

        .app-content {
          position: relative;
          z-index: 1;
          max-width: 500px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .agl-logo {
          height: 32px;
          object-fit: contain;
        }

        .v-divider {
          width: 1px;
          height: 20px;
          background: #e2e8f0;
        }

        .app-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #1D3557;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .stat-pill {
          background: white;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .search-section {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .search-section.minimized {
          margin-bottom: 1.5rem;
        }

        .welcome-text {
          margin-bottom: 2rem;
        }
        .welcome-text h2 { font-size: 1.75rem; color: #1e293b; margin-bottom: 0.5rem; }
        .welcome-text p { color: #64748b; line-height: 1.5; font-size: 0.95rem; }

        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 24px;
          padding: 1.5rem;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05);
        }

        .search-card {
          padding: 0.75rem;
        }

        .search-form { display: flex; flex-direction: column; gap: 0.75rem; }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 1.25rem;
          color: #1D3557;
          opacity: 0.5;
        }

        .search-input {
          width: 100%;
          padding: 1rem 3rem 1rem 3.5rem;
          border: none;
          background: #f1f5f9;
          border-radius: 18px;
          font-family: inherit;
          font-weight: 700;
          font-size: 1.1rem;
          color: #1e293b;
          outline: none;
          transition: all 0.2s;
        }
        .search-input:focus { background: #e2e8f0; }

        .clear-input {
          position: absolute;
          right: 1.25rem;
          color: #94a3b8;
          cursor: pointer;
        }

        .btn-search {
          background: #1D3557;
          color: white;
          border: none;
          border-radius: 18px;
          padding: 1rem;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(29, 53, 87, 0.3);
        }
        .btn-search:active { transform: scale(0.98); }

        .error-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #fee2e2;
          color: #b91c1c;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          margin-top: 1rem;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .result-area {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .status-card {
          background: linear-gradient(135deg, #1D3557 0%, #0f172a 100%);
          color: white;
          border: none;
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .facture-id { font-size: 0.75rem; font-weight: 700; opacity: 0.7; letter-spacing: 0.1em; }
        .status-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 800;
        }
        .badge-green { background: #064e3b; color: #34d399; }
        .badge-red { background: #7f1d1d; color: #f87171; }

        .client-name {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .timeline-section {
          margin-top: 1rem;
        }

        .section-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1.5rem;
        }

        .timeline-vertical {
          display: flex;
          flex-direction: column;
        }

        .timeline-item {
          display: flex;
          gap: 1.25rem;
          min-height: 80px;
        }

        .step-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .step-node {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          border: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: all 0.3s;
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .step-connector {
          width: 2px;
          flex: 1;
          background: #e2e8f0;
          margin: 4px 0;
        }

        .timeline-item.passed .step-node {
          background: #1D3557;
          border-color: #1D3557;
          color: white;
        }
        .timeline-item.passed .step-connector { background: #1D3557; }

        .timeline-item.active .step-node {
          box-shadow: 0 0 0 4px rgba(29, 53, 87, 0.15);
          border-color: #1D3557;
        }

        .step-content { padding-bottom: 1.5rem; flex: 1; }
        .step-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
        .step-label { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
        .step-duration { font-size: 0.65rem; font-weight: 800; background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 6px; }
        .step-desc { font-size: 0.8rem; color: #64748b; margin: 0; }

        .info-card h3 { font-size: 1rem; font-weight: 800; margin-bottom: 1rem; color: #1D3557; }
        .contact-grid { display: flex; flex-direction: column; gap: 0.75rem; }
        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: #475569;
          font-size: 0.9rem;
          font-weight: 600;
          padding: 0.5rem;
          border-radius: 12px;
          transition: background 0.2s;
        }
        .contact-item:hover { background: #f1f5f9; }
        .icon-box {
          background: #e2e8f0;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1D3557;
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
