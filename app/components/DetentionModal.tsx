'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, X, RefreshCw, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DetentionRow {
    id?: number;
    num_facture_caution: string;
    num_facture_dmdt: string;
    montant_facture: number | null;
    commentaire: string;
    date_dmdt: string;
    isNew?: boolean;
    isDirty?: boolean;
}

interface Props {
    numFacture: string;
    onClose: (hasChanges?: boolean) => void;
}

const emptyRow = (numFacture: string): DetentionRow => ({
    num_facture_caution: numFacture,
    num_facture_dmdt: '',
    montant_facture: null,
    commentaire: '',
    date_dmdt: '',
    isNew: true,
    isDirty: false,
});

export default function DetentionModal({ numFacture, onClose }: Props) {
    const [rows, setRows] = useState<DetentionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasSavedChanges, setHasSavedChanges] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const showNotif = (type: 'success' | 'error', msg: string) => {
        setNotification({ type, msg });
        setTimeout(() => setNotification(null), 4000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/detention?numFacture=${encodeURIComponent(numFacture)}`);
            const data = await res.json();
            setRows(data.map((r: DetentionRow) => ({ ...r, isNew: false, isDirty: false })));
        } catch {
            showNotif('error', 'Erreur de chargement des détentions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [numFacture]);

    const handleChange = (idx: number, field: keyof DetentionRow, value: string | number | null) => {
        setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value, isDirty: true } : r));
    };

    const addRow = () => {
        setRows(prev => [...prev, emptyRow(numFacture)]);
    };

    const removeRow = async (idx: number) => {
        const row = rows[idx];
        if (!row.isNew && row.id) {
            if (!confirm('Supprimer cette ligne ?')) return;
            try {
                const res = await fetch(`/api/detention?id=${row.id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error();
                showNotif('success', 'Ligne supprimée.');
                await fetchData();
            } catch {
                showNotif('error', 'Erreur lors de la suppression.');
            }
        } else {
            setRows(prev => prev.filter((_, i) => i !== idx));
        }
    };

    const saveAll = async () => {
        const dirtyOrNew = rows.filter(r => r.isDirty || r.isNew);
        if (dirtyOrNew.length === 0) {
            showNotif('success', 'Aucune modification à enregistrer.');
            return;
        }
        setSaving(true);
        try {
            for (const row of dirtyOrNew) {
                const payload = {
                    id: row.id,
                    num_facture_caution: row.num_facture_caution,
                    num_facture_dmdt: row.num_facture_dmdt,
                    montant_facture: row.montant_facture,
                    commentaire: row.commentaire,
                    date_dmdt: row.date_dmdt,
                };
                if (row.isNew) {
                    await fetch('/api/detention', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                } else {
                    await fetch('/api/detention', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                }
            }
            showNotif('success', `${dirtyOrNew.length} ligne(s) enregistrée(s) avec succès.`);
            setHasSavedChanges(true);
            await fetchData();
        } catch {
            showNotif('error', 'Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    const totalMontant = rows.reduce((sum, r) => sum + (r.montant_facture || 0), 0);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.55)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div style={{
                background: 'white', borderRadius: '12px',
                width: '100%', maxWidth: '860px', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    background: 'var(--primary)',
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={20} /> Gestion des Détentions (DMDT)
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.15rem' }}>
                            Dossier : <strong>{numFacture}</strong>
                        </div>
                    </div>
                    <button onClick={() => onClose(hasSavedChanges)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '6px', padding: '0.4rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Notifications */}
                {notification && (
                    <div style={{
                        padding: '0.65rem 1.5rem',
                        background: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        color: notification.type === 'success' ? '#16a34a' : '#dc2626',
                        fontWeight: 700, fontSize: '0.85rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        borderBottom: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                    }}>
                        {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {notification.msg}
                    </div>
                )}

                {/* Contenu scrollable */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                            <p>Chargement...</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--primary-light)', borderBottom: '2px solid var(--border)' }}>
                                    {['N° Facture DMDT', 'Montant (FCFA)', 'Commentaire', 'Date DMDT', ''].map(h => (
                                        <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                            Aucune détention enregistrée pour ce dossier.
                                        </td>
                                    </tr>
                                )}
                                {rows.map((row, idx) => (
                                    <tr key={row.id ?? `new-${idx}`}
                                        style={{ borderBottom: '1px solid var(--border)', background: row.isDirty || row.isNew ? '#fefce8' : 'white' }}>
                                        <td style={{ padding: '0.4rem 0.5rem' }}>
                                            <input type="text" value={row.num_facture_dmdt || ''}
                                                onChange={e => handleChange(idx, 'num_facture_dmdt', e.target.value)}
                                                placeholder="FD01200049"
                                                style={{ width: '140px', padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.875rem' }} />
                                        </td>
                                        <td style={{ padding: '0.4rem 0.5rem' }}>
                                            <input type="number" value={row.montant_facture ?? ''}
                                                onChange={e => handleChange(idx, 'montant_facture', e.target.value ? parseFloat(e.target.value) : null)}
                                                placeholder="0"
                                                style={{ width: '130px', padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.875rem', textAlign: 'right' }} />
                                        </td>
                                        <td style={{ padding: '0.4rem 0.5rem' }}>
                                            <input type="text" value={row.commentaire || ''}
                                                onChange={e => handleChange(idx, 'commentaire', e.target.value)}
                                                placeholder="Ex: 2 jrs de détention au transport"
                                                style={{ width: '100%', minWidth: '220px', padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.875rem' }} />
                                        </td>
                                        <td style={{ padding: '0.4rem 0.5rem' }}>
                                            <input type="date" value={row.date_dmdt || ''}
                                                onChange={e => handleChange(idx, 'date_dmdt', e.target.value)}
                                                className={row.date_dmdt ? 'has-value' : ''}
                                                style={{ padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.875rem' }} />
                                        </td>
                                        <td style={{ padding: '0.4rem 0.5rem' }}>
                                            <button onClick={() => removeRow(idx)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {rows.length > 0 && (
                                <tfoot>
                                    <tr style={{ background: 'var(--primary-light)', borderTop: '2px solid var(--border)', fontWeight: 800 }}>
                                        <td style={{ padding: '0.6rem 0.75rem' }}>TOTAL</td>
                                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: 'var(--primary)' }}>
                                            {totalMontant.toLocaleString('fr-FR')} FCFA
                                        </td>
                                        <td colSpan={3}></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--primary-light)'
                }}>
                    <button onClick={addRow}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'white', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                        <Plus size={16} /> Ajouter une ligne
                    </button>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => onClose(hasSavedChanges)}
                            style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                            Fermer
                        </button>
                        <button onClick={saveAll} disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}>
                            {saving ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
