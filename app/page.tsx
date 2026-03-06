'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, FilePlus, Save, RotateCcw, AlertCircle,
  CheckCircle2, Trash2, X, AlertTriangle, RefreshCw,
  FileText, ExternalLink, ClipboardList, User, Mail
} from 'lucide-react';
import DetentionModal from '@/app/components/DetentionModal';
import FicheAvoir from '@/app/components/FicheAvoir';
import PartenaireModal from '@/app/components/PartenaireModal';
import PartenaireCombobox from '@/app/components/PartenaireCombobox';
import ArmateurSelect from '@/app/components/ArmateurSelect';

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
}

const today = new Date().toISOString().split('T')[0];

const emptyDossier: Dossier = {
  type_remboursement: 'CAUTION',
  date_reception: today,
  transitaire_actif: 1,
  client_actif: 0,
  montant_caution: 0,
  nbre_20: 0,
  nbre_40: 0,
  jours_franchise: 0,
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
    setForm(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : finalValue }));
  };

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.checked ? 1 : 0 }));
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
        {/* Header modale */}
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

        {/* Corps du modal */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 'var(--radius-md)', color: '#dc2626', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Bloc unique : PRISE EN COMPTE DE LA DEMANDE DE REMBOURSEMENT */}
          <ModalSection title="PRISE EN COMPTE DE LA DEMANDE DE REMBOURSEMENT" accentColor="#0284c7">
            <div className="grid grid-cols-2">
              <div>
                <label>type remboursement</label>
                <select name="type_remboursement" value={form.type_remboursement || ''} onChange={handleChange}>
                  <option value="CAUTION">CAUTION</option>
                  <option value="TROP_PERCU">TROP PERÇU</option>
                </select>
              </div>
              <div>
                <label>n° facture caution</label>
                <input type="text" name="num_facture_caution" value={form.num_facture_caution || ''} onChange={handleChange} style={{ fontWeight: 700, background: '#f1f5f9' }} readOnly />
              </div>
              <div>
                <label>date de facture</label>
                <input type="date" name="date_facture" value={form.date_facture || ''} onChange={handleChange} />
              </div>
              <div>
                <label>montant caution (fcfa)</label>
                <input type="number" name="montant_caution" value={form.montant_caution ?? 0} onChange={handleChange} />
              </div>
              <div>
                <label>numéro du bl</label>
                <input type="text" name="num_bl" value={form.num_bl || ''} onChange={handleChange} placeholder="—" />
              </div>
              <div>
                <label>armateur</label>
                <ArmateurSelect
                  value={form.armateur || ''}
                  onChange={(val) => setForm(prev => ({ ...prev, armateur: val }))}
                />
              </div>
              <div>
                <label>date de réception</label>
                <input type="date" name="date_reception" value={form.date_reception || ''} onChange={handleChange} />
              </div>
              <div>
                <label>nom transitaire</label>
                <PartenaireCombobox
                  name="transitaire_nom"
                  value={form.transitaire_nom || ''}
                  onChange={(val) => setForm(prev => ({ ...prev, transitaire_nom: val }))}
                  type="transitaire"
                  onManage={(id) => setPartenaireModal({ open: true, id })}
                  placeholder="Rechercher transitaire..."
                  formData={form}
                />
              </div>
              <div>
                <label>nom client</label>
                <PartenaireCombobox
                  name="client_nom"
                  value={form.client_nom || ''}
                  onChange={(val) => setForm(prev => ({ ...prev, client_nom: val }))}
                  type="client"
                  onManage={(id) => setPartenaireModal({ open: true, id })}
                  placeholder="Rechercher client..."
                  formData={form}
                />
              </div>
              <div>
                <label className="checkbox-group" style={{ marginTop: '0.1rem' }}>
                  <input type="checkbox" name="client_actif" checked={form.client_actif === 1} onChange={handleCheck} />
                  <label style={{ cursor: 'pointer', marginBottom: 0 }}>client actif</label>
                </label>
              </div>
              <div>
                <label>mandataire</label>
                <input type="text" name="mandataire_nom" value={form.mandataire_nom || ''} onChange={handleChange} placeholder="—" />
              </div>
              <div>
                <label className="checkbox-group" style={{ marginTop: '0.1rem' }}>
                  <input type="checkbox" name="transitaire_actif" checked={form.transitaire_actif === 1} onChange={handleCheck} />
                  <label style={{ cursor: 'pointer', marginBottom: 0 }}>transitaire actif / mandataire</label>
                </label>
              </div>
              <div>
                <label>n° pièce mandataire</label>
                <input type="text" name="num_piece_mandataire" value={form.num_piece_mandataire || ''} onChange={handleChange} placeholder="—" />
              </div>
            </div>
          </ModalSection>

          {/* Email de notification */}
          <ModalSection title="NOTIFICATION PAR EMAIL" accentColor="#7c3aed">
            <div style={{ position: 'relative' }}>
              <label>email de notification (optionnel)</label>
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



          {/* Actions */}
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

function ModalSection({ title, children, accentColor = 'var(--accent)' }: { title: string; children: React.ReactNode; accentColor?: string }) {
  return (
    <div style={{ marginBottom: '1rem', borderLeft: `3px solid ${accentColor}`, paddingLeft: '0.75rem' }}>
      <div style={{
        fontSize: '0.78rem', fontWeight: 800, color: accentColor,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

/* ═══════════ PAGE PRINCIPALE ═══════════ */

function HomePageInternal() {
  // Persistance sessionStorage
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
  const [searchResult, setSearchResult] = useState<{ found: boolean; dossier?: Dossier } | null>(initSearchResult);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState<Dossier>(initFormData);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sauvegarde automatique
  useEffect(() => { sessionStorage.setItem('home_numFacture', numFacture); }, [numFacture]);
  useEffect(() => { sessionStorage.setItem('home_formData', JSON.stringify(formData)); }, [formData]);
  useEffect(() => { sessionStorage.setItem('home_searchResult', JSON.stringify(searchResult)); }, [searchResult]);

  // Synchronisation auto des dates de clôture
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

  const [showDetentionModal, setShowDetentionModal] = useState(false);
  const [showFicheAvoir, setShowFicheAvoir] = useState(false);
  const [partenaireModal, setPartenaireModal] = useState<{ open: boolean; id?: number }>({ open: false });

  const searchParams = useSearchParams();

  // Chargement automatique via URL ?facture=...
  useEffect(() => {
    const f = searchParams.get('facture');
    if (f) {
      doSearch(f);
    }
  }, [searchParams]);

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
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : finalValue }));
  };

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.checked ? 1 : 0 }));
  };

  const doSave = async () => {
    // Logique automatique pour date_cloture et date_retour_compta
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
        // On rafraîchit les données depuis le serveur pour être sûr
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
    <div className="container" style={{ position: 'relative' }}>

      {/* Toast notification */}
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

      {/* Modal Nouveau Dossier */}
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

      {/* En-tête supprimé selon la demande utilisateur */}

      {/* Barre de recherche */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--background)',
        padding: '1rem 0 0.5rem 0',
      }}>
        <section className="card" style={{
          maxWidth: '570px', margin: '0 auto',
          padding: '1rem 1.25rem',
          borderTop: `4px solid var(--accent)`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          <form onSubmit={doSearch} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Entrez le numéro de facture (ex: FI01202158)..."
                value={numFacture}
                onChange={e => setNumFacture(e.target.value)}
                style={{ paddingLeft: '2.5rem', fontSize: '1rem', fontFamily: 'Inter, sans-serif' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem' }}>
              {loading
                ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Recherche...</>
                : <><Search size={15} /> Vérifier</>
              }
            </button>
            {searchResult && (
              <button type="button" className="btn btn-secondary" onClick={doReset} title="Réinitialiser" style={{ padding: '0.5rem' }}>
                <RotateCcw size={15} />
              </button>
            )}
          </form>

          {error && (
            <p style={{ color: '#ef4444', marginTop: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
              <AlertTriangle size={14} /> {error}
            </p>
          )}

          {isExisting && (
            <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.8rem', background: '#f0fdf4', borderRadius: 'var(--radius-md)', color: '#16a34a', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={14} /> Dossier <strong>{formData.num_facture_caution}</strong> — Modifier ou Ajouter des données
            </div>
          )}
        </section>
      </div>

      {/* Formulaire principal (visible uniquement si dossier existant trouvé) */}
      {isExisting && (
        <section className="card" style={{
          maxWidth: '1200px', margin: '0 auto 1.5rem auto',
          borderRadius: '1rem',
          border: '2px solid var(--accent)',
          opacity: loading ? 0.6 : 1,
          transition: 'opacity 0.3s'
        }}>
          {/* En-tête formulaire */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
            <FileText size={20} color="var(--accent)" />
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1rem', margin: 0, color: 'var(--primary)', fontWeight: 700 }}>
                Dossier : {formData.num_facture_caution}
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Modification du dossier existant
              </p>
            </div>
          </div>

          {/* 1. PRISE EN COMPTE DE LA DEMANDE DE REMBOURSEMENT */}
          <Fieldset title="PRISE EN COMPTE DE LA DEMANDE DE REMBOURSEMENT" accentColor="#0284c7" bgTint="#f0f9ff">
            <div className="grid grid-cols-4">
              <Field label="type remboursement">
                <select name="type_remboursement" value={formData.type_remboursement || ''} onChange={handleChange}>
                  <option value="CAUTION">CAUTION</option>
                  <option value="TROP_PERCU">TROP PERÇU</option>
                </select>
              </Field>
              <Field label="n° facture caution">
                <input type="text" value={formData.num_facture_caution || ''} readOnly
                  style={{ fontWeight: 800, background: '#f1f5f9' }} />
              </Field>
              <Field label="date de facture">
                <input type="date" name="date_facture" value={formData.date_facture || ''} onChange={handleChange} />
              </Field>
              <Field label="montant caution (fcfa)">
                <input type="number" name="montant_caution" value={formData.montant_caution ?? 0} onChange={handleChange} />
              </Field>
              <Field label="numéro du bl">
                <input type="text" name="num_bl" value={formData.num_bl || ''} onChange={handleChange} placeholder="—" />
              </Field>
              <Field label="armateur">
                <ArmateurSelect
                  value={formData.armateur || ''}
                  onChange={(val) => setFormData(prev => ({ ...prev, armateur: val }))}
                />
              </Field>
              <Field label="date de réception">
                <input type="date" name="date_reception" value={formData.date_reception || ''} onChange={handleChange} />
              </Field>
              <Field label="nom transitaire">
                <PartenaireCombobox
                  name="transitaire_nom"
                  value={formData.transitaire_nom || ''}
                  onChange={(val) => setFormData(prev => ({ ...prev, transitaire_nom: val }))}
                  type="transitaire"
                  onManage={(id) => setPartenaireModal({ open: true, id })}
                  placeholder="Rechercher transitaire..."
                  formData={formData}
                />
              </Field>
              <Field label="nom client">
                <PartenaireCombobox
                  name="client_nom"
                  value={formData.client_nom || ''}
                  onChange={(val) => setFormData(prev => ({ ...prev, client_nom: val }))}
                  type="client"
                  onManage={(id) => setPartenaireModal({ open: true, id })}
                  placeholder="Rechercher client..."
                  formData={formData}
                />
              </Field>
              <Field label=" ">
                <label className="checkbox-group" style={{ marginTop: '0.1rem' }}>
                  <input type="checkbox" name="client_actif" checked={formData.client_actif === 1} onChange={handleCheck} />
                  <label style={{ cursor: 'pointer', marginBottom: 0 }}>client actif</label>
                </label>
              </Field>
              <Field label="mandataire">
                <input type="text" name="mandataire_nom" value={formData.mandataire_nom || ''} onChange={handleChange} placeholder="—" />
              </Field>
              <Field label=" ">
                <label className="checkbox-group" style={{ marginTop: '0.1rem' }}>
                  <input type="checkbox" name="transitaire_actif" checked={formData.transitaire_actif === 1} onChange={handleCheck} />
                  <label style={{ cursor: 'pointer', marginBottom: 0 }}>transitaire actif</label>
                </label>
              </Field>
              <Field label="n° pièce mandataire">
                <input type="text" name="num_piece_mandataire" value={formData.num_piece_mandataire || ''} onChange={handleChange} placeholder="—" />
              </Field>
            </div>
          </Fieldset>

          {/* 2. TRANSMISSION A LA LIGNE POUR TRAITEMENT */}
          <Fieldset title="TRANSMISSION A LA LIGNE POUR TRAITEMENT" accentColor="#059669" bgTint="#ecfdf5">
            <div className="grid grid-cols-4">
              <Field label="date trans. ligne">
                <input type="date" name="date_transmission_ligne" value={formData.date_transmission_ligne || ''} onChange={handleChange} />
              </Field>
              <Field label="date retour ligne">
                <input type="date" name="date_retour_ligne" value={formData.date_retour_ligne || ''} onChange={handleChange} />
              </Field>
            </div>
          </Fieldset>

          {/* 3. FRANCHISE ET B.A.D */}
          <Fieldset title="FRANCHISE ET B.A.D" accentColor="#d97706" bgTint="#fffbeb">
            <div className="grid grid-cols-4">
              <Field label="jours franchise">
                <input type="number" name="jours_franchise" value={formData.jours_franchise ?? 0} onChange={handleChange} />
              </Field>
              <Field label="date bad">
                <input type="date" name="date_bad" value={formData.date_bad || ''} onChange={handleChange} />
              </Field>
              <Field label="date de sortie">
                <input type="date" name="date_sortie" value={formData.date_sortie || ''} onChange={handleChange} />
              </Field>
              <Field label="date de retour">
                <input type="date" name="date_retour" value={formData.date_retour || ''} onChange={handleChange} />
              </Field>
              <Field label="nbre 20'">
                <input type="number" name="nbre_20" value={formData.nbre_20 ?? 0} onChange={handleChange} />
              </Field>
              <Field label="nbre 40'">
                <input type="number" name="nbre_40" value={formData.nbre_40 ?? 0} onChange={handleChange} />
              </Field>
            </div>
          </Fieldset>

          {/* 4. DETENTION ET LITIGE */}
          <Fieldset title="DETENTION ET LITIGE" accentColor="#dc2626" bgTint="#fef2f2">
            <div className="grid grid-cols-4">
              <Field label="date début litige">
                <input type="date" name="date_mise_litige" value={formData.date_mise_litige || ''} onChange={handleChange} />
              </Field>
              <Field label="date fin litige">
                <input type="date" name="date_fin_litige" value={formData.date_fin_litige || ''} onChange={handleChange} />
              </Field>
              <Field label="Date Trans Sce détention">
                <input type="date" name="date_trans_sce_detention" value={formData.date_trans_sce_detention || ''} onChange={handleChange} />
              </Field>
              <Field label=" ">
                <button
                  type="button"
                  onClick={() => setShowDetentionModal(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                    color: 'white', border: 'none', borderRadius: '8px',
                    padding: '0.5rem 0.9rem', fontWeight: 800, fontSize: '0.8rem',
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                    whiteSpace: 'nowrap', width: '100%', justifyContent: 'center',
                  }}
                >
                  <ExternalLink size={14} />
                  Détentions (DMDT)
                </button>
              </Field>
              <div style={{ gridColumn: '1 / span 2' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.72rem', color: '#0f172a', marginBottom: '0.15rem', textTransform: 'capitalize' }}>Commentaire Sce Détention</label>
                <textarea name="commentaire_sce_detention" value={formData.commentaire_sce_detention || ''} onChange={handleChange} rows={2} style={{ width: '100%' }} />
              </div>
              <Field label="date suspension">
                <input type="date" name="date_suspendu" value={formData.date_suspendu || ''} onChange={handleChange} />
              </Field>
              <Field label="date fin suspension">
                <input type="date" name="date_fin_suspension" value={formData.date_fin_suspension || ''} onChange={handleChange} />
              </Field>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.72rem', color: '#0f172a', marginBottom: '0.15rem', textTransform: 'capitalize' }}>Raison Suspension</label>
                <textarea name="raison_suspension" value={formData.raison_suspension || ''} onChange={handleChange} rows={1} style={{ width: '100%' }} />
              </div>
            </div>
          </Fieldset>

          {/* 5. AVOIR */}
          <Fieldset title="AVOIR" accentColor="#7c3aed" bgTint="#f5f3ff">
            <div className="grid grid-cols-4">
              <Field label="Date Trans Avoir">
                <input type="date" name="date_mise_avoir" value={formData.date_mise_avoir || ''} onChange={handleChange} />
              </Field>
              <Field label="Date Retour Avoir">
                <input type="date" name="date_fin_avoir" value={formData.date_fin_avoir || ''} onChange={handleChange} />
              </Field>
              <Field label="Numéro avoir">
                <input type="text" name="num_avoir" value={formData.num_avoir || ''} onChange={handleChange} placeholder="—" />
              </Field>
              <Field label=" ">
                <button
                  type="button"
                  onClick={() => setShowFicheAvoir(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                    color: 'white', border: 'none', borderRadius: '8px',
                    padding: '0.55rem 1rem', fontWeight: 800, fontSize: '0.82rem',
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
                    whiteSpace: 'nowrap', width: '100%', justifyContent: 'center'
                  }}
                >
                  <ClipboardList size={16} />
                  Fiche Avoir
                </button>
              </Field>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.72rem', color: '#0f172a', marginBottom: '0.15rem', textTransform: 'capitalize' }}>Commentaire Avoir</label>
                <input list="prev-comments" name="commentaire_avoir" value={formData.commentaire_avoir || ''} onChange={handleChange} placeholder="Choisir ou saisir un commentaire..." />
                <datalist id="prev-comments">
                  <option value="Dossier conforme" />
                  <option value="En attente justificatif" />
                  <option value="Avoir partiel" />
                </datalist>
              </div>
            </div>
          </Fieldset>

          {/* 6. PIECE DE CAISSE */}
          <Fieldset title="PIECE DE CAISSE" accentColor="#4f46e5" bgTint="#f8fafc">
            <div className="grid grid-cols-4">
              <Field label="Date pièce caisse">
                <input type="date" name="date_piece_caisse" value={formData.date_piece_caisse || ''} onChange={handleChange} />
              </Field>
              <Field label="Date 1ère signature">
                <input type="date" name="date_1er_signature" value={formData.date_1er_signature || ''} onChange={handleChange} />
              </Field>
              <Field label="Date Retour 1ere Signature">
                <input type="date" name="date_retour_1er_signature" value={formData.date_retour_1er_signature || ''} onChange={handleChange} />
              </Field>
              <Field label="Date 2ème Signature">
                <input type="date" name="date_2e_signature" value={formData.date_2e_signature || ''} onChange={handleChange} />
              </Field>
              <Field label="Retour Date 2ème Signature">
                <input type="date" name="date_retour_2e_signature" value={formData.date_retour_2e_signature || ''} onChange={handleChange} />
              </Field>
              <Field label="Date trans. Compta">
                <input type="date" name="date_transmission_compta" value={formData.date_transmission_compta || ''} onChange={handleChange} />
              </Field>
              <Field label="Date retour Compta">
                <input type="date" name="date_retour_compta" value={formData.date_retour_compta || ''} onChange={handleChange} />
              </Field>
              <Field label="Date chèque">
                <input type="date" name="date_cheque" value={formData.date_cheque || ''} onChange={handleChange} />
              </Field>
              <Field label="Num. chèque">
                <input type="text" name="num_cheque" value={formData.num_cheque || ''} onChange={handleChange} placeholder="—" />
              </Field>
              <Field label="montant final (fcfa)">
                <input type="number" name="montant_final" value={formData.montant_final ?? 0} onChange={handleChange} />
              </Field>
              <Field label="date clôture">
                <input type="date" name="date_cloture" value={formData.date_cloture || ''} onChange={handleChange} />
              </Field>
            </div>
          </Fieldset>

          {/* Boutons d'action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <button className="btn" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              onClick={doDelete} disabled={deleting}>
              <Trash2 size={15} style={{ marginRight: '0.4rem' }} />
              {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={doReset} style={{ display: 'flex', alignItems: 'center', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                <RotateCcw size={15} style={{ marginRight: '0.4rem' }} /> Réinitialiser
              </button>
              <button className="btn btn-primary" onClick={doSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                <Save size={15} style={{ marginRight: '0.4rem' }} />
                {saving ? 'Sauvegarde...' : 'Mettre à jour'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* État vide (aucune recherche) */}
      {!isExisting && !loading && (
        <div style={{
          maxWidth: '860px', margin: '0 auto',
          textAlign: 'center', padding: '2rem', opacity: 0.45
        }}>
          <Search size={48} style={{ marginBottom: '0.75rem', color: 'var(--border)' }} />
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
            Entrez un numéro de facture et cliquez sur <strong>Vérifier</strong>
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Si le dossier existe, ses données seront affichées.<br />
            Sinon, un formulaire de création s&apos;ouvrira automatiquement.
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:disabled, select:disabled, textarea:disabled {
          background: #f8fafc !important;
          color: #94a3b8;
          cursor: not-allowed;
        }
      `}</style>

      {/* Fiche de Gestion des Avoirs */}
      {showFicheAvoir && (
        <FicheAvoir
          dossier={formData}
          onClose={() => setShowFicheAvoir(false)}
        />
      )}

      {/* Modale Gestion Détentions */}
      {showDetentionModal && formData.num_facture_caution && (
        <DetentionModal
          numFacture={formData.num_facture_caution}
          onClose={() => setShowDetentionModal(false)}
        />
      )}

      {/* Gestion des Partenaires */}
      <PartenaireModal
        isOpen={partenaireModal.open}
        onClose={() => setPartenaireModal({ open: false })}
        partenaireId={partenaireModal.id}
        onSaveSuccess={(p) => {
          showNotif('success', `Partenaire ${p.nom_partenaire} enregistré.`);
          // Optionnel: On pourrait mettre à jour le champ actuel si on était en train de le saisir
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <HomePageInternal />
    </Suspense>
  );
}

/* ─── Sous-composants ─────────────────────────────────────── */

function Fieldset({ title, children, accentColor = 'var(--accent)', bgTint = 'transparent' }: { title: string; children: React.ReactNode; accentColor?: string; bgTint?: string }) {
  return (
    <div style={{
      marginBottom: '1.25rem',
      padding: '1rem',
      borderRadius: '12px',
      background: bgTint,
      border: `1px solid ${bgTint === 'transparent' ? 'transparent' : accentColor + '20'}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.8rem',
        fontSize: '0.82rem', fontWeight: 800, color: accentColor,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem'
      }}>
        <div style={{
          padding: '0.3rem 0.6rem',
          background: accentColor,
          color: 'white',
          borderRadius: '6px',
          fontSize: '0.7rem',
          boxShadow: `0 2px 6px ${accentColor}40`
        }}>
          {title.split(' ')[0]}
        </div>
        {title}
        <span style={{ flex: 1, height: '2px', background: `linear-gradient(to right, ${accentColor}40, transparent)`, borderRadius: 2 }} />
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, labelStyle }: { label: string; children: React.ReactNode; labelStyle?: React.CSSProperties }) {
  return (
    <div>
      {label.trim() && (
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.72rem', color: '#0f172a', marginBottom: '0.15rem', textTransform: 'capitalize', letterSpacing: '0.03em', ...labelStyle }}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}
