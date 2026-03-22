'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, FilePlus, Save, RotateCcw, AlertCircle,
  CheckCircle2, Trash2, X, AlertTriangle, RefreshCw,
  FileText, ExternalLink, ClipboardList, Mail, Printer,
  Plus, LayoutDashboard, Clock, Users, TrendingUp, Edit3
} from 'lucide-react';

import RecouvrementModal from '@/app/components/RecouvrementModal';
import DetentionModal from '@/app/components/DetentionModal';
import FicheAvoir from '@/app/components/FicheAvoir';
import ArmateurSelect from '@/app/components/ArmateurSelect';
import PartenaireCombobox from '@/app/components/PartenaireCombobox';
import PartenaireModal from '@/app/components/PartenaireModal';
import { useAuth } from '@/app/components/AuthProvider';

interface Dossier {
  id?: number;
  type_remboursement?: string | null;
  nature_rembt?: string | null;
  num_facture_caution?: string | null;
  montant_caution?: number | null;
  date_facture?: string | null;
  num_bl?: string | null;
  armateur?: string | null;
  date_reception?: string | null;
  transitaire_actif?: number | null;
  transitaire_nom?: string | null;
  client_actif?: number | null;
  client_nom?: string | null;
  mandataire_nom?: string | null;
  num_piece_mandataire?: string | null;
  date_transmission_ligne?: string | null;
  date_retour_ligne?: string | null;
  date_mise_litige?: string | null;
  date_fin_litige?: string | null;
  date_trans_sce_detention?: string | null;
  commentaire_sce_detention?: string | null;
  date_suspendu?: string | null;
  date_fin_suspension?: string | null;
  raison_suspension?: string | null;
  date_trans_rec?: string | null;
  date_ret_rec?: string | null;
  observ_rec?: string | null;
  jours_franchise?: number | null;
  date_bad?: string | null;
  date_sortie?: string | null;
  date_retour?: string | null;
  nbre_20?: number | null;
  nbre_40?: number | null;
  date_mise_avoir?: string | null;
  date_fin_avoir?: string | null;
  num_avoir?: string | null;
  commentaire_avoir?: string | null;
  date_piece_caisse?: string | null;
  date_1er_signature?: string | null;
  date_retour_1er_signature?: string | null;
  date_2e_signature?: string | null;
  date_retour_2e_signature?: string | null;
  date_transmission_compta?: string | null;
  date_retour_compta?: string | null;
  date_cheque?: string | null;
  num_cheque?: string | null;
  montant_final?: number | null;
  date_cloture?: string | null;
  propose_par?: string | null;
  banque?: string | null;
  cloture_sans_cheque?: boolean | null;
  dateClotureSansCheque?: string | null;
}

const emptyDossier: Dossier = {
  transitaire_actif: 0,
  client_actif: 0,
  type_remboursement: 'CAUTION',
};

/* ═══════════ MODAL SIMPLIFIÉ ═══════════ */
function NewDossierModal({
  numFacture,
  onClose,
  onSuccess,
  setPartenaireModal,
}: {
  numFacture: string;
  onClose: () => void;
  onSuccess: (dossier: Dossier) => void;
  setPartenaireModal: (v: { open: boolean; id?: number }) => void;
}) {
  const [form, setForm] = useState<Dossier>({
    ...emptyDossier,
    num_facture_caution: numFacture,
  });
  const [notificationEmail, setNotificationEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    if (type !== 'number' && type !== 'date' && typeof value === 'string') {
      finalValue = value.toUpperCase();
    }
    setForm(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : finalValue }));
  };

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(prev => {
      if (!checked) return prev;
      return { 
        ...prev, 
        [name]: 1,
        [name === 'client_actif' ? 'transitaire_actif' : 'client_actif']: 0
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, notification_email: notificationEmail }),
      });
      if (!res.ok) throw new Error('Erreur lors de la création');
      const created = await res.json();
      onSuccess(created);
    } catch {
      setError('Impossible de créer le dossier. Vérifiez le serveur.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'white', borderRadius: '1.25rem', width: '100%', maxWidth: '680px',
        boxShadow: '0 25px 60px -10px rgba(0,0,0,0.3)',
        border: '2px solid var(--accent)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          borderRadius: '1.1rem 1.1rem 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FilePlus size={22} color="white" />
            <div>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>
                Nouveau Dossier
              </h2>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>
                {numFacture} — Numéro non trouvé dans la base
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
            cursor: 'pointer', borderRadius: '50%', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 'var(--radius-md)', color: '#dc2626', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <ModalSection title="PRISE EN COMPTE DE LA DEMANDE DE REMBOURSEMENT" accentColor="#0284c7">
            <div className="grid grid-cols-2">
              <Field label="Type Remboursement *">
                <select name="type_remboursement" value={form.type_remboursement || ''} onChange={handleChange} className={form.type_remboursement ? "has-value" : ""} required>
                  <option value="">—</option>
                  <option value="CAUTION">CAUTION</option>
                  <option value="TROP_PERCU">TROP PERÇU</option>
                </select>
              </Field>
              <Field label="N° Facture Caution">
                <input type="text" name="num_facture_caution" value={form.num_facture_caution || ''} onChange={handleChange} style={{ fontWeight: 700, background: '#f1f5f9' }} readOnly />
              </Field>
              <Field label="Date de Facture *">
                <input type={form.date_facture ? "date" : "text"} name="date_facture" value={form.date_facture || ''} onChange={handleChange} 
                  onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !form.date_facture && (e.target.type = "text")} 
                  placeholder="JJ/MM/AAAA" className={form.date_facture ? 'has-value' : ''} required />
              </Field>
              <Field label="Montant Caution (FCFA) *">
                <input type="number" name="montant_caution" value={form.montant_caution ?? ''} onChange={handleChange} required />
              </Field>
              <Field label="Numéro du BL *">
                <input type="text" name="num_bl" value={form.num_bl || ''} onChange={handleChange} placeholder="—" required />
              </Field>
              <Field label="Armateur *">
                <ArmateurSelect
                  value={form.armateur || ''}
                  onChange={(val) => setForm(prev => ({ ...prev, armateur: val }))}
                  required
                />
              </Field>
              <Field label="Date de Réception *">
                <input type={form.date_reception ? "date" : "text"} name="date_reception" value={form.date_reception || ''} onChange={handleChange} 
                  onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !form.date_reception && (e.target.type = "text")} 
                  placeholder="JJ/MM/AAAA" className={form.date_reception ? 'has-value' : ''} required />
              </Field>
              <Field label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Nom Transitaire *
                  <input type="checkbox" name="transitaire_actif" title="transitaire actif" checked={form.transitaire_actif === 1} onChange={handleCheck} style={{ cursor: 'pointer', margin: 0, width: '13px', height: '13px' }} />
                </div>
              }>
                <PartenaireCombobox
                  name="transitaire_nom"
                  value={form.transitaire_nom || ''}
                  onChange={(val) => setForm(prev => ({ ...prev, transitaire_nom: val }))}
                  type="transitaire"
                  onManage={(id) => setPartenaireModal({ open: true, id })}
                  placeholder="Rechercher transitaire..."
                  formData={form}
                  required
                />
              </Field>
              <Field label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Nom Client *
                  <input type="checkbox" name="client_actif" title="client actif" checked={form.client_actif === 1} onChange={handleCheck} style={{ cursor: 'pointer', margin: 0, width: '13px', height: '13px' }} />
                </div>
              }>
                <PartenaireCombobox
                  name="client_nom"
                  value={form.client_nom || ''}
                  onChange={(val) => setForm(prev => ({ ...prev, client_nom: val }))}
                  type="client"
                  onManage={(id) => setPartenaireModal({ open: true, id })}
                  placeholder="Rechercher client..."
                  formData={form}
                  required
                />
              </Field>
              <Field label="Mandataire *">
                <input type="text" name="mandataire_nom" value={form.mandataire_nom || ''} onChange={handleChange} placeholder="—" required />
              </Field>
              <Field label="N° Pièce Mandataire *">
                <input type="text" name="num_piece_mandataire" value={form.num_piece_mandataire || ''} onChange={handleChange} placeholder="—" required />
              </Field>
            </div>
          </ModalSection>

          <ModalSection title="NOTIFICATION PAR EMAIL" accentColor="#7c3aed">
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.72rem', color: '#0f172a', marginBottom: '0.15rem' }}>Email de notification (optionnel)</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="ex: client@email.com"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                Si renseigné, un email récapitulatif sera envoyé à cette adresse lors de la création.
              </p>
            </div>
          </ModalSection>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
              <X size={15} style={{ marginRight: '0.4rem' }} /> Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
              <Save size={15} style={{ marginRight: '0.4rem' }} />
              {saving ? 'Création...' : 'Créer le dossier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════ MAIN PAGE COMPONENTS ═══════════ */

function HomePageInternal() {
  const { user } = useAuth();
  
  const initNumFacture = () => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('home_numFacture') || '';
  };
  const initFormData = (): Dossier => {
    if (typeof window === 'undefined') return emptyDossier;
    try {
      const saved = sessionStorage.getItem('home_formData');
      return saved ? JSON.parse(saved) : emptyDossier;
    } catch { return emptyDossier; }
  };
  const initSearchResult = () => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem('home_searchResult');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  };

  const [numFacture, setNumFacture] = useState(initNumFacture);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{ 
    found: boolean; 
    dossier?: Dossier; 
    counts?: { detentions: number; recouvrements: number };
  } | null>(initSearchResult);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState<Dossier>(initFormData);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showDetentionModal, setShowDetentionModal] = useState(false);
  const [showRecouvrementModal, setShowRecouvrementModal] = useState(false);
  const [showFicheAvoir, setShowFicheAvoir] = useState(false);
  const [partenaireModal, setPartenaireModal] = useState<{ open: boolean; id?: number }>({ open: false });
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setDashboardStats(data))
      .catch(err => console.error('Stats error', err));
  }, []);

  useEffect(() => {
    const f = searchParams.get('facture');
    if (f) doSearch(f);
  }, [searchParams]);

  useEffect(() => { sessionStorage.setItem('home_numFacture', numFacture); }, [numFacture]);
  useEffect(() => { sessionStorage.setItem('home_formData', JSON.stringify(formData)); }, [formData]);
  useEffect(() => { sessionStorage.setItem('home_searchResult', JSON.stringify(searchResult)); }, [searchResult]);

  useEffect(() => {
    if (formData.date_cheque) {
      if (formData.date_cloture !== formData.date_cheque || formData.date_retour_compta !== formData.date_cheque) {
        setFormData(prev => ({
          ...prev,
          date_cloture: prev.date_cheque,
          date_retour_compta: prev.date_cheque
        }));
      }
    }
  }, [formData.date_cheque, formData.date_cloture, formData.date_retour_compta]);

  const isExisting = searchResult?.found === true;

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const doSearch = async (e?: React.FormEvent | string) => {
    let searchFacture = numFacture;
    if (typeof e === 'string') {
      searchFacture = e;
      setNumFacture(e);
    } else if (e) {
      e.preventDefault();
    }

    if (!searchFacture.trim()) return;

    setLoading(true);
    setError(null);
    setSearchResult(null);
    try {
      const res = await fetch(`/api/dossier/${searchFacture.trim()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSearchResult(data);
      if (data.found) {
        setFormData(data.dossier);
      } else {
        setShowModal(true);
      }
    } catch {
      setError('Impossible de contacter le serveur.');
      showNotif('error', 'Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  const doReset = () => {
    setNumFacture('');
    setSearchResult(null);
    setFormData(emptyDossier);
    setError(null);
    setShowModal(false);
    sessionStorage.removeItem('home_numFacture');
    sessionStorage.removeItem('home_formData');
    sessionStorage.removeItem('home_searchResult');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    if (type !== 'number' && type !== 'date' && typeof value === 'string' && name !== 'notification_email') {
      finalValue = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : finalValue }));
  };

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    if (!checked) return;
    setFormData(prev => ({
      ...prev,
      [name]: 1,
      [name === 'client_actif' ? 'transitaire_actif' : 'client_actif']: 0
    }));
  };

  const doSave = async () => {
    const finalData = { ...formData };
    if (finalData.date_cheque) {
      finalData.date_cloture = finalData.date_cheque;
      finalData.date_retour_compta = finalData.date_cheque;
    }

    setSaving(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/dossier/${formData.num_facture_caution}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });
      if (res.ok) {
        showNotif('success', 'Dossier mis à jour avec succès.');
        setFormData(finalData);
        await doSearch(formData.num_facture_caution || '');
      } else {
        showNotif('error', 'Erreur lors de la sauvegarde.');
      }
    } catch { showNotif('error', 'Erreur réseau.'); }
    finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!confirm('Supprimer ce dossier définitivement ?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/dossier/${formData.num_facture_caution}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showNotif('success', 'Dossier supprimé.');
      doReset();
    } catch {
      showNotif('error', 'Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container" style={{ position: 'relative', minHeight: '100vh', padding: 0, maxWidth: 'none' }}>
      
      {notification && (
        <div style={{
          position: 'fixed', top: '2rem', right: '2rem', zIndex: 2000,
          background: notification.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600,
          boxShadow: 'var(--shadow-lg)', maxWidth: '420px'
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {notification.message}
          <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginLeft: 'auto' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {showModal && (
        <NewDossierModal
          numFacture={numFacture}
          onClose={() => { setShowModal(false); setSearchResult(null); }}
          onSuccess={(created) => {
            setShowModal(false);
            showNotif('success', `Dossier ${numFacture} créé avec succès !`);
            setSearchResult({ found: true, dossier: created });
            setFormData(created);
          }}
          setPartenaireModal={setPartenaireModal}
        />
      )}

      <main style={{ flex: 1, padding: isExisting ? '1rem 2rem' : '0' }}>
        {!isExisting && (
          <div style={{ padding: '6rem 2rem 2rem 2rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '2rem', color: 'var(--primary)' }}>Consulter ou Créer un nouveau dossier</h1>
            <div style={{ maxWidth: '600px', margin: '0 auto' }} className="card">
              <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Entrez un numéro de facture pour commencer</p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="text" placeholder="N° FACTURE" value={numFacture} onChange={e => setNumFacture(e.target.value.toUpperCase())} style={{ paddingLeft: '2.5rem' }} onKeyDown={(e) => e.key === 'Enter' && doSearch()} />
                </div>
                <button onClick={() => doSearch()} className="btn btn-primary">CONSULTER</button>
              </div>
            </div>
          </div>
        )}

        {isExisting && (
          <>
            <div style={{
              position: 'sticky', top: 0, zIndex: 100,
              background: 'var(--background)',
              padding: '1rem 0 0.5rem 0',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <section className="card" style={{ maxWidth: '800px', width: '100%', padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '1.25rem', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={22} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#1e293b' }} />
                    <input type="text" value={numFacture} onChange={e => setNumFacture(e.target.value.toUpperCase())} style={{ paddingLeft: '3rem', fontSize: '1.2rem', fontWeight: 900, border: '1px solid #e2e8f0', background: '#fff', color: '#1e293b' }} placeholder="N° FACTURE" onKeyDown={(e) => e.key === 'Enter' && doSearch()} />
                  </div>
                  <button onClick={() => doSearch()} className="btn" style={{ background: '#6366f1', color: 'white', padding: '0 1.5rem', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Search size={18} /> Vérifier
                  </button>
                  <button onClick={() => doSave()} disabled={saving} className="btn" style={{ background: '#10b981', color: 'white', padding: '0 1.5rem', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Save size={18} /> {saving ? '...' : 'Mettre à jour'}
                  </button>
                  <button onClick={doReset} className="btn-secondary" style={{ width: '48px', height: '48px', padding: 0, borderRadius: '10px' }} title="Retour à l'accueil"><RotateCcw size={20} /></button>
                </div>
                <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <CheckCircle2 size={14} /> Dossier {formData.num_facture_caution} — Modifier ou Ajouter des données
                </div>
              </section>
            </div>

            <section className="animate-fade-in card" style={{ 
                border: '2px solid #6366f1', 
                padding: '2rem', 
                boxShadow: '0 10px 40px rgba(99, 102, 241, 0.12)', 
                background: 'white',
                maxWidth: '1200px',
                margin: '0 auto 2rem auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: '#6366f1', color: 'white', padding: '0.5rem', borderRadius: '8px' }}>
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Dossier : {formData.num_facture_caution}</h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Modification du dossier existant</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1" style={{ gap: '1.5rem' }}>
                    <Fieldset title="PRISE EN COMPTE DE LA DEMANDE DE REMBOURSEMENT" accentColor="#0284c7" bgTint="rgba(2, 132, 199, 0.02)">
                        <div className="grid grid-cols-4">
                            <Field label="Type Remboursement">
                                <select name="type_remboursement" value={formData.type_remboursement || ''} onChange={handleChange}>
                                    <option value="">—</option>
                                    <option value="CAUTION">CAUTION</option>
                                    <option value="TROP_PERCU">TROP PERÇU</option>
                                </select>
                            </Field>
                            <Field label="N° Facture Caution">
                                <input type="text" value={formData.num_facture_caution || ''} style={{ fontWeight: 800, background: '#f8fafc' }} readOnly />
                            </Field>
                            <Field label="Date De Facture">
                                <input type={formData.date_facture ? "date" : "text"} name="date_facture" value={formData.date_facture || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_facture && (e.target.type = "text")} />
                            </Field>
                            <Field label="Montant Caution (Fcfa)">
                                <input type="number" name="montant_caution" value={formData.montant_caution ?? ''} onChange={handleChange} />
                            </Field>
                            <Field label="Numéro Du Bl">
                                <input type="text" name="num_bl" value={formData.num_bl || ''} onChange={handleChange} />
                            </Field>
                            <Field label="Armateur">
                                <ArmateurSelect value={formData.armateur || ''} onChange={(val) => setFormData(prev => ({ ...prev, armateur: val }))} />
                            </Field>
                            <Field label="Date De Réception">
                                <input type={formData.date_reception ? "date" : "text"} name="date_reception" value={formData.date_reception || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_reception && (e.target.type = "text")} />
                            </Field>
                            <Field label={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    Nom Transitaire
                                    <input type="checkbox" name="transitaire_actif" checked={formData.transitaire_actif === 1} onChange={handleCheck} style={{ width: '13px', height: '13px' }} />
                                </div>
                            }>
                                <PartenaireCombobox name="transitaire_nom" value={formData.transitaire_nom || ''} onChange={(v) => setFormData(prev => ({ ...prev, transitaire_nom: v }))} type="transitaire" onManage={(id) => setPartenaireModal({ open: true, id })} formData={formData} />
                            </Field>
                            <Field label={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    Nom Client
                                    <input type="checkbox" name="client_actif" checked={formData.client_actif === 1} onChange={handleCheck} style={{ width: '13px', height: '13px' }} />
                                </div>
                            }>
                                <PartenaireCombobox name="client_nom" value={formData.client_nom || ''} onChange={(v) => setFormData(prev => ({ ...prev, client_nom: v }))} type="client" onManage={(id) => setPartenaireModal({ open: true, id })} formData={formData} />
                            </Field>
                            <Field label="Mandataire">
                                <input type="text" name="mandataire_nom" value={formData.mandataire_nom || ''} onChange={handleChange} />
                            </Field>
                            <Field label="N° Pièce Mandataire">
                                <input type="text" name="num_piece_mandataire" value={formData.num_piece_mandataire || ''} onChange={handleChange} />
                            </Field>
                        </div>
                    </Fieldset>

                    <Fieldset title="TRANSMISSION A LA LIGNE POUR TRAITEMENT" accentColor="#10b981" bgTint="rgba(16, 185, 129, 0.02)">
                        <div className="grid grid-cols-4">
                            <Field label="Date Trans. Ligne">
                                <input type={formData.date_transmission_ligne ? "date" : "text"} name="date_transmission_ligne" value={formData.date_transmission_ligne || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_transmission_ligne && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date Retour Ligne">
                                <input type={formData.date_retour_ligne ? "date" : "text"} name="date_retour_ligne" value={formData.date_retour_ligne || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_retour_ligne && (e.target.type = "text")} />
                            </Field>
                        </div>
                    </Fieldset>

                    <Fieldset title="FRANCHISE ET B.A.D" accentColor="#f59e0b" bgTint="rgba(245, 158, 11, 0.02)">
                        <div className="grid grid-cols-6">
                            <Field label="Jours Franchise">
                                <input type="number" name="jours_franchise" value={formData.jours_franchise ?? ''} onChange={handleChange} />
                            </Field>
                            <Field label="Date Bad">
                                <input type={formData.date_bad ? "date" : "text"} name="date_bad" value={formData.date_bad || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_bad && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date De Sortie">
                                <input type={formData.date_sortie ? "date" : "text"} name="date_sortie" value={formData.date_sortie || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_sortie && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date De Retour">
                                <input type={formData.date_retour ? "date" : "text"} name="date_retour" value={formData.date_retour || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_retour && (e.target.type = "text")} />
                            </Field>
                            <Field label="Nbre 20'">
                                <input type="number" name="nbre_20" value={formData.nbre_20 ?? ''} onChange={handleChange} />
                            </Field>
                            <Field label="Nbre 40'">
                                <input type="number" name="nbre_40" value={formData.nbre_40 ?? ''} onChange={handleChange} />
                            </Field>
                        </div>
                    </Fieldset>

                    <Fieldset title="MISE EN LITIGE (AVEC OU SANS DETENTION)" accentColor="#ef4444" bgTint="rgba(239, 68, 68, 0.02)">
                        <div className="grid grid-cols-4">
                            <Field label="Date Début Litige">
                                <input type={formData.date_mise_litige ? "date" : "text"} name="date_mise_litige" value={formData.date_mise_litige || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_mise_litige && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date Fin Litige">
                                <input type={formData.date_fin_litige ? "date" : "text"} name="date_fin_litige" value={formData.date_fin_litige || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_fin_litige && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date Trans Sce Détention">
                                <input type={formData.date_trans_sce_detention ? "date" : "text"} name="date_trans_sce_detention" value={formData.date_trans_sce_detention || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_trans_sce_detention && (e.target.type = "text")} />
                            </Field>
                            <Field label="Détentions (DMDT)" labelStyle={{ justifyContent: 'center' }}>
                                <button onClick={() => setShowDetentionModal(true)} className="btn btn-primary" style={{ width: '100%', gap: '0.5rem', background: '#1e40af' }}>
                                    <FileText size={18} /> Détentions (DMDT) {searchResult?.counts?.detentions !== undefined && `(${searchResult.counts.detentions})`}
                                </button>
                            </Field>
                            <div style={{ gridColumn: 'span 4' }}>
                                <Field label="Commentaire Sce Détention">
                                    <textarea name="commentaire_sce_detention" value={formData.commentaire_sce_detention || ''} onChange={handleChange} placeholder="..." style={{ minHeight: '60px' }} />
                                </Field>
                            </div>
                        </div>
                    </Fieldset>

                    <Fieldset title="PIECE COMPTABLE (AVOIR)" accentColor="#6366f1" bgTint="rgba(99, 102, 241, 0.02)">
                        <div className="grid grid-cols-4">
                            <Field label="Date Début Avoir">
                                <input type={formData.date_mise_avoir ? "date" : "text"} name="date_mise_avoir" value={formData.date_mise_avoir || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_mise_avoir && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date Fin Avoir">
                                <input type={formData.date_fin_avoir ? "date" : "text"} name="date_fin_avoir" value={formData.date_fin_avoir || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_fin_avoir && (e.target.type = "text")} />
                            </Field>
                            <Field label="N° Pièce">
                                <input type="text" name="num_avoir" value={formData.num_avoir || ''} onChange={handleChange} />
                            </Field>
                            <Field label="Fiche Avoir" labelStyle={{ justifyContent: 'center' }}>
                                <button onClick={() => setShowFicheAvoir(true)} className="btn btn-secondary" style={{ width: '100%', gap: '0.5rem' }}>
                                    <Printer size={18} /> Fiche Gestion Avoirs
                                </button>
                            </Field>
                            <div style={{ gridColumn: 'span 4' }}>
                                <Field label="Commentaire Avoir">
                                    <textarea name="commentaire_avoir" value={formData.commentaire_avoir || ''} onChange={handleChange} placeholder="..." style={{ minHeight: '40px' }} />
                                </Field>
                            </div>
                        </div>
                    </Fieldset>

                    <Fieldset title="RECOUVREMENT" accentColor="#7c3aed" bgTint="rgba(124, 58, 237, 0.02)">
                        <div className="grid grid-cols-5">
                            <Field label="Date Trans Rec">
                                <input type={formData.date_trans_rec ? "date" : "text"} name="date_trans_rec" value={formData.date_trans_rec || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_trans_rec && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date Ret Rec">
                                <input type={formData.date_ret_rec ? "date" : "text"} name="date_ret_rec" value={formData.date_ret_rec || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_ret_rec && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date Début Suspension">
                                <input type={formData.date_suspendu ? "date" : "text"} name="date_suspendu" value={formData.date_suspendu || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_suspendu && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date Fin Suspension">
                                <input type={formData.date_fin_suspension ? "date" : "text"} name="date_fin_suspension" value={formData.date_fin_suspension || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_fin_suspension && (e.target.type = "text")} />
                            </Field>
                            <Field label="Recouvrement" labelStyle={{ justifyContent: 'center' }}>
                                <button onClick={() => setShowRecouvrementModal(true)} className="btn btn-primary" style={{ width: '100%', gap: '0.5rem', background: '#6d28d9' }}>
                                    <FileText size={18} /> Recouvrements {searchResult?.counts?.recouvrements !== undefined && `(${searchResult.counts.recouvrements})`}
                                </button>
                            </Field>
                            <div style={{ gridColumn: 'span 5' }}>
                                <Field label="Observations Rec.">
                                    <textarea name="observ_rec" value={formData.observ_rec || ''} onChange={handleChange} placeholder="..." style={{ minHeight: '60px' }} />
                                </Field>
                            </div>
                        </div>
                    </Fieldset>


                    <Fieldset title="SIGNATURE & PIECE DE CAISSE" accentColor="#4f46e5" bgTint="rgba(79, 70, 229, 0.02)">
                        <div className="grid grid-cols-3">
                            <Field label="Date 1ère Signature">
                                <input type={formData.date_1er_signature ? "date" : "text"} name="date_1er_signature" value={formData.date_1er_signature || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_1er_signature && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date Retour 1ere Sig.">
                                <input type={formData.date_retour_1er_signature ? "date" : "text"} name="date_retour_1er_signature" value={formData.date_retour_1er_signature || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_retour_1er_signature && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date 2ème Signature">
                                <input type={formData.date_2e_signature ? "date" : "text"} name="date_2e_signature" value={formData.date_2e_signature || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_2e_signature && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date Retour 2e Sig.">
                                <input type={formData.date_retour_2e_signature ? "date" : "text"} name="date_retour_2e_signature" value={formData.date_retour_2e_signature || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_retour_2e_signature && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date Pièce Caisse">
                                <input type={formData.date_piece_caisse ? "date" : "text"} name="date_piece_caisse" value={formData.date_piece_caisse || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_piece_caisse && (e.target.type = "text")} />
                            </Field>
                            <Field label="Montant Final (FCFA)">
                                <input type="number" name="montant_final" value={formData.montant_final ?? 0} readOnly 
                                    style={{ background: '#f8fafc', color: '#1e293b', fontWeight: 800, border: '1px solid #cbd5e1' }}
                                    title="Calculé automatiquement : Caution - (Détentions + Recouvrements)" />
                            </Field>
                        </div>
                    </Fieldset>

                    <Fieldset title="TRANSMISSION COMPTA / EMISSION DE CHEQUE & CLOTURE DE DOSSIER" accentColor="#0369a1" bgTint="rgba(3, 105, 161, 0.02)">
                        <div className="grid grid-cols-5">
                            <Field label="Date Trans. Compta">
                                <input type={formData.date_transmission_compta ? "date" : "text"} name="date_transmission_compta" value={formData.date_transmission_compta || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_transmission_compta && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date Retour Compta">
                                <input type={formData.date_retour_compta ? "date" : "text"} name="date_retour_compta" value={formData.date_retour_compta || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_retour_compta && (e.target.type = "text")} />
                            </Field>
                            <Field label="Date Chèque">
                                <input type={formData.date_cheque ? "date" : "text"} name="date_cheque" value={formData.date_cheque || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_cheque && (e.target.type = "text")} />
                            </Field>
                            <Field label="Num. Chèque">
                                <input type="text" name="num_cheque" value={formData.num_cheque || ''} onChange={handleChange} placeholder="..." />
                            </Field>
                            <Field label="Date Clôture">
                                <input type={formData.date_cloture ? "date" : "text"} name="date_cloture" value={formData.date_cloture || ''} onChange={handleChange} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => !formData.date_cloture && (e.target.type = "text")} />
                            </Field>
                        </div>
                        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(3, 105, 161, 0.1)', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.76rem', color: '#0369a1', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.04em' }}>
                                <input 
                                    type="checkbox" 
                                    name="cloture_sans_cheque" 
                                    checked={formData.cloture_sans_cheque || false} 
                                    onChange={(e) => setFormData(prev => ({ ...prev, cloture_sans_cheque: e.target.checked }))} 
                                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0369a1' }}
                                />
                                Clôture sans chèque
                            </label>
                            
                            {formData.cloture_sans_cheque && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0f9ff', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Dossier clotué à la date du
                                    </span>
                                    <input 
                                        type="date" 
                                        name="dateClotureSansCheque" 
                                        value={formData.dateClotureSansCheque || ''} 
                                        onChange={handleChange} 
                                        style={{ border: '1px solid #7dd3fc', background: 'white', padding: '0.3rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#0c4a6e', outline: 'none' }}
                                    />
                                </div>
                            )}
                        </div>
                    </Fieldset>
                </div>
            </section>
          </>
        )}
      </main>

      {showFicheAvoir && <FicheAvoir dossier={formData} onClose={() => setShowFicheAvoir(false)} />}
      
      {showDetentionModal && formData.num_facture_caution && (
        <DetentionModal numFacture={formData.num_facture_caution} onClose={(hasChanges) => {
          setShowDetentionModal(false);
          if (hasChanges && formData.num_facture_caution) doSearch(formData.num_facture_caution);
        }} />
      )}

      {showRecouvrementModal && formData.num_facture_caution && (
        <RecouvrementModal numFacture={formData.num_facture_caution} onClose={(hasChanges) => {
          setShowRecouvrementModal(false);
          if (hasChanges && formData.num_facture_caution) doSearch(formData.num_facture_caution);
        }} />
      )}

      <PartenaireModal isOpen={partenaireModal.open} onClose={() => setPartenaireModal({ open: false })} partenaireId={partenaireModal.id} onSaveSuccess={(p) => showNotif('success', `Partenaire ${p.nom_partenaire} enregistré.`)} />

    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>}>
      <HomePageInternal />
    </Suspense>
  );
}

/* ─── Helper Components ─────────────────────────────────────── */

function HomeQuickStat({ label, value, icon, color, bg }: { label: string; value: string | number; icon: React.ReactNode; color: string; bg?: string }) {
  return (
    <div style={{ 
      background: bg || 'rgba(255,255,255,0.1)', 
      backdropFilter: 'blur(10px)',
      padding: '1.25rem', 
      borderRadius: '20px', 
      border: '1px solid rgba(255,255,255,0.15)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      textAlign: 'left',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s ease',
      cursor: 'default'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.4rem', borderRadius: '8px', color: 'white' }}>{icon}</div> {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 900, color: color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function Field({ label, children, labelStyle }: { label: React.ReactNode; children: React.ReactNode; labelStyle?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      {label && (typeof label === 'string' ? label.trim() !== '' : true) && (
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem', 
          fontWeight: 800, 
          fontSize: '0.76rem', 
          color: '#1e293b', 
          marginBottom: '0.2rem', 
          textTransform: 'uppercase', 
          letterSpacing: '0.04em', 
          ...labelStyle 
        }}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

function Fieldset({ title, children, accentColor = 'var(--accent)', bgTint = 'transparent' }: { title: string; children: React.ReactNode; accentColor?: string; bgTint?: string }) {
  return (
    <fieldset style={{
      marginBottom: '1.5rem',
      borderRadius: '8px',
      background: bgTint,
      border: `1.5px solid ${accentColor}50`,
      padding: '1.25rem',
      position: 'relative',
      margin: 0,
      minInlineSize: 'auto'
    }}>
      <legend style={{
        padding: '0 0.75rem',
        fontSize: '0.82rem',
        fontWeight: 900,
        color: accentColor,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

const ModalSection = ({ title, children, accentColor = 'var(--accent)' }: { title: string; children: React.ReactNode; accentColor?: string }) => (
  <div style={{ marginBottom: '1.25rem', borderLeft: `3px solid ${accentColor}`, paddingLeft: '0.85rem' }}>
    <div style={{
      fontSize: '0.82rem', fontWeight: 800, color: accentColor,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
    }}>
      {title}
    </div>
    {children}
  </div>
);
