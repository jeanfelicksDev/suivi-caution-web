'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Ship, AlertTriangle, FileCheck, PenLine, PenSquare, Calculator,
    ChevronRight, X, Calendar, CheckCircle2, Loader2, Clock, FileText,
    RotateCcw, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DossierAttente {
    id: number;
    num_facture_caution: string | null;
    date_debut: string;
    date_fin: string | null;
    armateur: string | null;
    client_nom: string | null;
    date_suspendu: string | null;
    date_fin_suspension: string | null;
}

interface BoutonConfig {
    key: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    borderColor: string;
    labelDebut: string;
    labelFin: string;
    readOnly?: boolean;
}

// ─── Config des boutons ───────────────────────────────────────────────────────

const BOUTONS: BoutonConfig[] = [
    { key: 'armateur', label: 'Chez Armateur', icon: <Ship size={16} />, color: '#2563eb', bg: '#eff6ff', borderColor: '#bfdbfe', labelDebut: 'Date Trans. Ligne', labelFin: 'Date Retour Ligne' },
    { key: 'detention', label: 'Sce Détention', icon: <AlertTriangle size={16} />, color: '#be123c', bg: '#fff1f2', borderColor: '#fecdd3', labelDebut: 'Date Détention', labelFin: 'Date 1ère Signature' },
    { key: 'avoir', label: 'Traitement Avoirs', icon: <FileCheck size={16} />, color: '#7c3aed', bg: '#f5f3ff', borderColor: '#ddd6fe', labelDebut: 'Date Mise Avoir', labelFin: 'Date Fin Avoir' },
    { key: 'recouvrement', label: 'Sce Recouvrement', icon: <Calculator size={16} />, color: '#c2410c', bg: '#fff7ed', borderColor: '#fed7aa', labelDebut: 'Date Trans. Recouv.', labelFin: 'Date Retour Recouv.' },
    { key: 'signature1', label: '1ère Signature', icon: <PenLine size={16} />, color: '#d97706', bg: '#fffbeb', borderColor: '#fde68a', labelDebut: 'Date 1ère Sig.', labelFin: 'Date Retour 1ère' },
    { key: 'signature2', label: '2ème Signature', icon: <PenSquare size={16} />, color: '#b45309', bg: '#fffbeb', borderColor: '#fde68a', labelDebut: 'Date 2ème Sig.', labelFin: 'Date Retour 2ème' },
];



// ─── Jours ouvrés (sans weekends ni jours fériés CI) ─────────────────────────

const FERIES_CI = ['01-01', '05-01', '08-07', '08-15', '11-01', '11-15', '12-25'];

function getJoursOuvres(debut: Date, fin: Date): number {
    if (debut > fin) return 0;
    let count = 0;
    const current = new Date(debut);
    current.setHours(0, 0, 0, 0);
    const end = new Date(fin);
    end.setHours(0, 0, 0, 0);
    while (current < end) {
        const dow = current.getDay();
        if (dow >= 1 && dow <= 5) {
            const mm = String(current.getMonth() + 1).padStart(2, '0');
            const dd = String(current.getDate()).padStart(2, '0');
            if (!FERIES_CI.includes(`${mm}-${dd}`)) {
                count++;
            }
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
}

// ─── Formatage date ───────────────────────────────────────────────────────────

function formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    // Format YYYY-MM-DD → DD/MM/YYYY
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
}

// ─── Modal dossiers en attente ────────────────────────────────────────────────

function AttenteModal({
    bouton,
    onClose,
}: {
    bouton: BoutonConfig;
    onClose: () => void;
}) {
    const [dossiers, setDossiers] = useState<DossierAttente[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dateRetour, setDateRetour] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchDossiers = useCallback(async () => {
        setLoading(true);
        setMessage(null);
        setSelectedIds([]);
        try {
            const res = await fetch(`/api/attente?type=${bouton.key}`);
            if (res.ok) {
                const data = await res.json();
                setDossiers(data.dossiers || []);
            }
        } finally {
            setLoading(false);
        }
    }, [bouton.key]);

    useEffect(() => {
        fetchDossiers();
    }, [fetchDossiers]);

    const handleEnregistrer = async () => {
        if (!dateRetour) {
            setMessage({ type: 'error', text: 'Veuillez saisir une date avant d\'enregistrer.' });
            return;
        }
        if (selectedIds.length === 0) {
            setMessage({ type: 'error', text: 'Veuillez sélectionner au moins un dossier.' });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/attente', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: bouton.key, ids: selectedIds, date_fin: dateRetour }),
            });
            if (res.ok) {
                const data = await res.json();
                setMessage({
                    type: 'success',
                    text: `✓ ${data.updated} dossier(s) mis à jour avec succès.`,
                });
                // Recharger la liste
                fetchDossiers();
                setDateRetour('');
            } else {
                setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement.' });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(dossiers.map(d => d.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                style={{
                    background: '#fff', borderRadius: '16px',
                    width: '100%', maxWidth: '860px',
                    maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                }}
            >
                {/* Header modal */}
                <div
                    style={{
                        background: bouton.color, color: '#fff',
                        padding: '1.25rem 1.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.2)', borderRadius: '50%',
                            width: '36px', height: '36px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            {bouton.icon}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{bouton.label}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                                {loading ? 'Chargement...' : `${dossiers.length} dossier(s) en attente`}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                            borderRadius: '50%', width: '32px', height: '32px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Barre "Appliquer date" - masquée en mode lecture seule */}
                {!bouton.readOnly && (
                    <div
                        style={{
                            padding: '1rem 1.5rem',
                            background: bouton.bg,
                            borderBottom: `1px solid ${bouton.borderColor}`,
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            flexShrink: 0, flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                            <Calendar size={18} color={bouton.color} />
                            <label
                                style={{ fontWeight: 600, fontSize: '0.85rem', color: bouton.color, whiteSpace: 'nowrap' }}
                            >
                                {bouton.labelFin} à appliquer :
                            </label>
                            <input
                                type="date"
                                value={dateRetour}
                                onChange={(e) => setDateRetour(e.target.value)}
                                style={{
                                    border: `1.5px solid ${bouton.borderColor}`,
                                    borderRadius: '8px', padding: '0.4rem 0.75rem',
                                    fontSize: '0.9rem', outline: 'none',
                                    background: '#fff', color: '#1e293b',
                                    fontWeight: 600,
                                }}
                            />
                        </div>
                        <button
                            onClick={handleEnregistrer}
                            disabled={saving || selectedIds.length === 0}
                            style={{
                                background: bouton.color, color: '#fff',
                                border: 'none', borderRadius: '8px',
                                padding: '0.5rem 1.25rem', fontWeight: 700,
                                fontSize: '0.85rem', cursor: saving || selectedIds.length === 0 ? 'not-allowed' : 'pointer',
                                opacity: saving || selectedIds.length === 0 ? 0.6 : 1,
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={15} />}
                            Enregistrer ({selectedIds.length})
                        </button>
                    </div>
                )}

                {/* Message retour */}
                {message && (
                    <div
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                            color: message.type === 'success' ? '#16a34a' : '#dc2626',
                            fontSize: '0.9rem', fontWeight: 600,
                            borderBottom: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                            flexShrink: 0,
                        }}
                    >
                        {message.text}
                    </div>
                )}

                {/* Tableau */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '0.75rem', padding: '3rem', color: '#64748b',
                        }}>
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                            Chargement des dossiers...
                        </div>
                    ) : dossiers.length === 0 ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', padding: '3rem', gap: '0.75rem',
                            color: '#64748b',
                        }}>
                            <CheckCircle2 size={40} color="#10b981" />
                            <div style={{ fontWeight: 600, fontSize: '1rem', color: '#10b981' }}>
                                Aucun dossier en attente
                            </div>
                            <div style={{ fontSize: '0.85rem' }}>
                                Tous les dossiers ont été traités.
                            </div>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                                        {!bouton.readOnly && (
                                            <input
                                                type="checkbox"
                                                checked={dossiers.length > 0 && selectedIds.length === dossiers.length}
                                                onChange={handleSelectAll}
                                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                            />
                                        )}
                                        {bouton.readOnly && '#'}
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                                        N° Facture
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                                        Client / Armateur
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                                        {bouton.labelDebut}
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: bouton.color, borderBottom: '2px solid #e2e8f0' }}>
                                        {bouton.labelFin}
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                                        Attente (jours)
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {dossiers.map((d, idx) => {
                                    // Calcul jours d'attente en jours ouvrés (hors suspension)
                                    const debut = d.date_debut ? new Date(d.date_debut) : null;
                                    const today = new Date();
                                    let joursAttente: number | null = null;
                                    if (debut) {
                                        let total = getJoursOuvres(debut, today);
                                        // Soustraire la période de suspension
                                        if (d.date_suspendu) {
                                            const dSusp = new Date(d.date_suspendu);
                                            const dSuspFin = d.date_fin_suspension
                                                ? new Date(d.date_fin_suspension)
                                                : today; // suspension toujours en cours
                                            total -= getJoursOuvres(dSusp, dSuspFin);
                                        }
                                        joursAttente = Math.max(0, total);
                                    }

                                    return (
                                        <tr
                                            key={d.id}
                                            style={{
                                                background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = bouton.bg)}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f8fafc')}
                                        >
                                            <td style={{ padding: '0.65rem 1rem', color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>
                                                {!bouton.readOnly ? (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(d.id)}
                                                        onChange={() => handleSelectOne(d.id)}
                                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                    />
                                                ) : (
                                                    idx + 1
                                                )}
                                            </td>
                                            <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>
                                                {d.num_facture_caution || '—'}
                                            </td>
                                            <td style={{ padding: '0.65rem 1rem', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                                                <div style={{ fontWeight: 600 }}>{d.client_nom || '—'}</div>
                                                {d.armateur && (
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{d.armateur}</div>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.65rem 1rem', textAlign: 'center', color: '#334155', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{
                                                    background: '#f0f9ff', color: '#0369a1',
                                                    padding: '0.2rem 0.6rem', borderRadius: '6px',
                                                    fontSize: '0.8rem', fontWeight: 600,
                                                }}>
                                                    {formatDate(d.date_debut)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.65rem 1rem', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                                {dateRetour ? (
                                                    <span style={{
                                                        background: bouton.bg, color: bouton.color,
                                                        padding: '0.2rem 0.6rem', borderRadius: '6px',
                                                        fontSize: '0.8rem', fontWeight: 700,
                                                        border: `1px solid ${bouton.borderColor}`,
                                                    }}>
                                                        {formatDate(dateRetour)}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                                        Non renseigné
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.65rem 1rem', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                                {joursAttente !== null ? (
                                                    <span style={{
                                                        background: joursAttente > 30 ? '#fef2f2' : joursAttente > 14 ? '#fff7ed' : '#f0fdf4',
                                                        color: joursAttente > 30 ? '#dc2626' : joursAttente > 14 ? '#d97706' : '#16a34a',
                                                        padding: '0.2rem 0.6rem', borderRadius: '6px',
                                                        fontSize: '0.8rem', fontWeight: 700,
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                    }}>
                                                        <Clock size={12} />
                                                        {joursAttente} j
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td style={{ padding: '0.65rem 1rem', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                                <Link
                                                    href={`/?facture=${d.num_facture_caution}`}
                                                    onClick={onClose}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                        fontSize: '0.75rem', fontWeight: 700,
                                                        color: '#2563eb', textDecoration: 'none',
                                                        padding: '0.3rem 0.6rem', border: '1px solid #bfdbfe',
                                                        borderRadius: '6px', background: '#eff6ff',
                                                    }}
                                                >
                                                    <FileText size={12} /> Ouvrir
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}

// ─── Drawer principal ─────────────────────────────────────────────────────────

export default function AttenteTiroir() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeBouton, setActiveBouton] = useState<BoutonConfig | null>(null);
    const [counts, setCounts] = useState<Record<string, number>>({});

    // Charger tous les comptages au montage et après fermeture d'un modal
    const fetchAllCounts = useCallback(async () => {
        const results: Record<string, number> = {};
        await Promise.all(
            BOUTONS.map(async (b) => {
                try {
                    const res = await fetch(`/api/attente?type=${b.key}`);
                    if (res.ok) {
                        const data = await res.json();
                        results[b.key] = (data.dossiers || []).length;
                    }
                } catch { results[b.key] = 0; }
            })
        );
        setCounts(results);
    }, []);

    useEffect(() => { fetchAllCounts(); }, [fetchAllCounts]);

    const handleBouton = (bouton: BoutonConfig) => {
        setActiveBouton(bouton);
        setIsOpen(false);
    };

    const handleCloseModal = () => {
        setActiveBouton(null);
        fetchAllCounts(); // Rafraîchir les comptages après fermeture
    };

    return (
        <>
            {/* Bouton d'ouverture du tiroir */}
            <button
                className="nav-item"
                onClick={() => setIsOpen((v) => !v)}
                style={{
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: isOpen ? 'rgba(255,255,255,0.12)' : 'transparent',
                }}
            >
                <Clock size={20} />
                <span style={{ flex: 1, textAlign: 'left' }}>Dossiers en Attente</span>
                <ChevronRight
                    size={16}
                    style={{
                        transition: 'transform 0.25s',
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            {/* Tiroir coulissant */}
            <div
                style={{
                    overflow: 'hidden',
                    maxHeight: isOpen ? '400px' : '0',
                    transition: 'max-height 0.3s ease',
                }}
            >
                <div style={{ padding: '0.25rem 0 0.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    {BOUTONS.map((bouton) => {
                        const count = counts[bouton.key] ?? null;
                        return (
                            <button
                                key={bouton.key}
                                onClick={() => handleBouton(bouton)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                                    width: '100%', padding: '0.5rem 0.75rem',
                                    background: 'transparent',
                                    border: 'none', borderRadius: '6px',
                                    color: '#94a3b8',
                                    cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                                    textAlign: 'left', transition: 'background 0.15s, color 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = bouton.bg;
                                    e.currentTarget.style.color = bouton.color;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'rgba(226,232,240,0.85)';
                                }}
                            >
                                {/* Badge circulaire coloré */}
                                <span style={{
                                    flexShrink: 0,
                                    minWidth: '22px', height: '22px',
                                    borderRadius: '50%',
                                    background: count !== null && count > 0 ? bouton.color : 'rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    fontSize: '0.7rem', fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background 0.2s',
                                    lineHeight: 1,
                                    boxShadow: count !== null && count > 0 ? `0 0 0 2px ${bouton.color}40` : 'none',
                                }}>
                                    {count !== null ? count : '·'}
                                </span>
                                <span style={{ flex: 1 }}>{bouton.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            {activeBouton && (
                <AttenteModal
                    bouton={activeBouton}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
}
