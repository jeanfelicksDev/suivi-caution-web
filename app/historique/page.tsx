'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Search, RefreshCw, FileText, X, User, Printer, Download, Trash2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import ArmateurSelect from '@/app/components/ArmateurSelect';
import TransmissionReport from '@/app/components/TransmissionReport';
import PartenaireCombobox from '@/app/components/PartenaireCombobox';
import PartenaireSelect from '@/app/components/PartenaireSelect';
import PartenaireModal from '@/app/components/PartenaireModal';
import * as XLSX from 'xlsx';

interface DossierRow {
    id: number;
    num_facture_caution: string | null;
    num_bl: string | null;
    montant_caution: number | null;
    montant_final: number | null;
    armateur: string | null;
    client_nom: string | null;
    transitaire_nom: string | null;
    date_reception: string | null;
    date_transmission_ligne: string | null;
    date_mise_litige: string | null;
    date_suspendu: string | null;
    date_fin_suspension: string | null;
    date_retour_ligne: string | null;
    date_piece_caisse: string | null;
    date_1er_signature: string | null;
    date_2e_signature: string | null;
    date_cloture: string | null;
    date_transmission_compta: string | null;
    date_cheque: string | null;
    date_trans_sce_detention: string | null;
    date_mise_avoir: string | null;
    date_trans_rec: string | null;
}

/* ── Définition des étapes ─────────────────────────────────────────── */
const ETAPES = [
    { value: '', label: '—' },
    { value: 'date_reception', label: 'Demande Reçu' },
    { value: 'date_transmission_ligne', label: 'Transmission à l’armateur' },
    { value: 'date_mise_litige', label: 'Mise en Litige sans détention' },
    { value: 'date_trans_sce_detention', label: 'Mise en Litige Service détention' },
    { value: 'date_mise_avoir', label: 'Traitement de l’avoir' },
    { value: 'date_trans_rec', label: 'Contrôle Sce recouvrement' },
    { value: 'date_suspendu', label: 'Remboursement suspendue' },
    { value: 'date_1er_signature', label: 'Transmission pour 1ère signature' },
    { value: 'date_2e_signature', label: 'Transmission pour 2ème signature' },
    { value: 'date_piece_caisse', label: 'Pièce de caisse établie' },
    { value: 'date_transmission_compta', label: 'Transmission à la compta' },
    { value: 'date_cheque', label: 'Chèque émis' },
    { value: 'date_cloture', label: 'Clôturé sans chèque' },
] as const;

/** Couleur badge par étape */
const ETAPE_COLORS: Record<string, { bg: string; color: string }> = {
    date_reception: { bg: '#e0f2fe', color: '#0369a1' },
    date_transmission_ligne: { bg: '#fef9c3', color: '#854d0e' },
    date_mise_litige: { bg: '#fee2e2', color: '#b91c1c' },
    date_trans_sce_detention: { bg: '#fecdd3', color: '#be123c' },
    date_mise_avoir: { bg: '#fce7f3', color: '#be185d' },
    date_trans_rec: { bg: '#ffedd5', color: '#c2410c' },
    date_suspendu: { bg: '#fee2e2', color: '#dc2626' },
    date_1er_signature: { bg: '#dbeafe', color: '#1d4ed8' },
    date_2e_signature: { bg: '#dcfce7', color: '#15803d' },
    date_piece_caisse: { bg: '#ede9fe', color: '#6d28d9' },
    date_transmission_compta: { bg: '#f0fdf4', color: '#15803d' },
    date_cheque: { bg: '#ecfdf5', color: '#047857' },
    date_cloture: { bg: '#f1f5f9', color: '#475569' },
};

/** Détermine l'étape courante d'un dossier côté client (pour affichage badge) */
const ETAPE_SEQUENCE = [
    'date_reception',
    'date_transmission_ligne',
    'date_mise_litige',
    'date_trans_sce_detention',
    'date_mise_avoir',
    'date_trans_rec',
    'date_suspendu',
    'date_1er_signature',
    'date_2e_signature',
    'date_piece_caisse',
    'date_transmission_compta',
    'date_cheque',
    'date_cloture',
] as const;

function getEtapeCourante(row: DossierRow): { value: string; label: string } {
    let current = { value: '', label: '—' };
    for (const field of ETAPE_SEQUENCE) {
        if (row[field as keyof DossierRow]) {
            const found = ETAPES.find(e => e.value === field);
            if (found) current = { value: found.value, label: found.label };
        }
    }
    return current;
}

/* ── Filtres initiaux ─────────────────────────────────────────────── */
const emptyFilters = {
    numFacture: '',
    numBl: '',
    client: '',
    transitaire: '',
    armateur: '',
    etape: '',
    dateFrom: '',
    dateTo: '',
};

/* ── Page ─────────────────────────────────────────────────────────── */
export default function HistoriquePage() {
    // Chargement initial depuis sessionStorage
    const initFilters = (): typeof emptyFilters => {
        if (typeof window === 'undefined') return emptyFilters;
        try {
            const saved = sessionStorage.getItem('historique_filters');
            return saved ? { ...emptyFilters, ...JSON.parse(saved) } : emptyFilters;
        } catch { return emptyFilters; }
    };
    const initRows = (): DossierRow[] => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = sessionStorage.getItem('historique_rows');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    };
    const initSearched = (): boolean => {
        if (typeof window === 'undefined') return false;
        return sessionStorage.getItem('historique_searched') === 'true';
    };

    const [filters, setFilters] = useState(initFilters);
    const [rows, setRows] = useState<DossierRow[]>(initRows);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(initSearched);
    const [error, setError] = useState<string | null>(null);
    const [showTransmissionReport, setShowTransmissionReport] = useState(false);
    const [partenaireModal, setPartenaireModal] = useState<{ open: boolean; id?: number }>({ open: false });

    // Sauvegarde automatique dans sessionStorage à chaque changement
    useEffect(() => {
        sessionStorage.setItem('historique_filters', JSON.stringify(filters));
    }, [filters]);
    useEffect(() => {
        sessionStorage.setItem('historique_rows', JSON.stringify(rows));
    }, [rows]);
    useEffect(() => {
        sessionStorage.setItem('historique_searched', String(searched));
    }, [searched]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const doSearch = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filters.numFacture) params.set('numFacture', filters.numFacture);
            if (filters.numBl) params.set('numBl', filters.numBl);
            if (filters.client) params.set('client', filters.client);
            if (filters.transitaire) params.set('transitaire', filters.transitaire);
            if (filters.armateur) params.set('armateur', filters.armateur);
            if (filters.etape) params.set('etape', filters.etape);
            if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.set('dateTo', filters.dateTo);

            const res = await fetch(`/api/dossiers?${params.toString()}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setRows(data);
            setSearched(true);
        } catch {
            setError('Impossible de contacter le serveur.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const doReset = () => {
        setFilters(emptyFilters);
        setRows([]);
        setSearched(false);
        setError(null);
        sessionStorage.removeItem('historique_filters');
        sessionStorage.removeItem('historique_rows');
        sessionStorage.removeItem('historique_searched');
    };

    const fmt = (v: number | null) =>
        v != null ? v.toLocaleString('fr-FR') + ' FCFA' : '—';


    const etapeLabel = ETAPES.find(e => e.value === filters.etape)?.label || '';

    const handleExportExcel = () => {
        if (rows.length === 0) return;
        
        // Préparation des données pour l'export
        const exportData = rows.map(row => {
            const etape = getEtapeCourante(row);
            return {
                'Date Réception': row.date_reception ? new Date(row.date_reception).toLocaleDateString('fr-FR') : '',
                'N° Facture': row.num_facture_caution || '',
                'N° BL': row.num_bl || '',
                'Montant Caution': row.montant_caution || 0,
                'Montant Final': row.montant_final || 0,
                'Armateur': row.armateur || '',
                'Client': row.client_nom || '',
                'Transitaire': row.transitaire_nom || '',
                'Étape Courante': etape.label
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Historique");

        // Génération du fichier
        XLSX.writeFile(workbook, `Historique_Dossiers_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="container" style={{ maxWidth: 1350 }}>

            {/* Zone sticky : en-tête + filtres */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'var(--background)',
                padding: '0.75rem 0 0.25rem 0',
                marginBottom: '0.75rem',
            }}>

                {/* En-tête */}
                <header style={{ marginBottom: '1rem' }}>
                    <h1 style={{
                        fontSize: '1.8rem', marginBottom: '0.2rem',
                        background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>
                        Historique des Dossiers
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Filtrez et consultez tous les dossiers de caution enregistrés.
                    </p>
                </header>

                {/* Formulaire de filtres */}
                <section className="card" style={{ marginBottom: '1.25rem', borderTop: '4px solid var(--accent)' }}>
                    <form onSubmit={doSearch}>

                        {/* Ligne 1 : 4 champs texte */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div>
                                <label>N° Facture</label>
                                <input type="text" name="numFacture" value={filters.numFacture}
                                    onChange={handleChange} placeholder="ex: FI01202158" autoComplete="off" />
                            </div>
                            <div>
                                <label>N° BL</label>
                                <input type="text" name="numBl" value={filters.numBl}
                                    onChange={handleChange} placeholder="ex: MSCUX123456" autoComplete="off" />
                            </div>
                            <div>
                                <label style={{ textTransform: 'uppercase' }}>Client</label>
                                <PartenaireCombobox
                                    name="client"
                                    value={filters.client}
                                    onChange={(val) => setFilters(prev => ({ ...prev, client: val }))}
                                    type="client"
                                    onManage={(id) => setPartenaireModal({ open: true, id })}
                                    placeholder="NOM DU CLIENT"
                                    formData={filters}
                                />
                            </div>
                            <div>
                                <label style={{ textTransform: 'uppercase' }}>Transitaire</label>
                                <PartenaireCombobox
                                    name="transitaire"
                                    value={filters.transitaire}
                                    onChange={(val) => setFilters(prev => ({ ...prev, transitaire: val }))}
                                    type="transitaire"
                                    onManage={(id) => setPartenaireModal({ open: true, id })}
                                    placeholder="NOM DU TRANSITAIRE"
                                    formData={filters}
                                />
                            </div>
                        </div>

                        {/* Ligne 2 : Période + Armateur + Étape + boutons */}
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                            <div>
                                <label>
                                    {filters.etape 
                                        ? `Période de ${ETAPES.find(e => e.value === filters.etape)?.label || 'Traitement'} Du :`
                                        : 'Période De Réception Du :'
                                    }
                                </label>
                                <input type={filters.dateFrom ? "date" : "text"} name="dateFrom" value={filters.dateFrom} onChange={handleChange}
                                    onFocus={(e) => (e.target.type = "date")}
                                    onBlur={(e) => !filters.dateFrom && (e.target.type = "text")}
                                    placeholder="JJ/MM/AAAA"
                                    className={filters.dateFrom ? 'has-value' : ''}
                                    style={{ borderRadius: '8px' }} />
                            </div>
                            <div>
                                <label>Au :</label>
                                <input type={filters.dateTo ? "date" : "text"} name="dateTo" value={filters.dateTo} onChange={handleChange}
                                    onFocus={(e) => (e.target.type = "date")}
                                    onBlur={(e) => !filters.dateTo && (e.target.type = "text")}
                                    placeholder="JJ/MM/AAAA"
                                    className={filters.dateTo ? 'has-value' : ''}
                                    style={{ borderRadius: '8px' }} />
                            </div>

                            {/* Combobox Armateur */}
                            <div style={{ flex: '0 0 170px' }}>
                                <label>Armateur</label>
                                <ArmateurSelect
                                    value={filters.armateur}
                                    onChange={(val) => setFilters(prev => ({ ...prev, armateur: val }))}
                                    hideAdd={true}
                                    style={{
                                        width: '100%',
                                        fontWeight: filters.armateur ? 700 : 400,
                                        background: filters.armateur ? '#eff6ff' : 'white',
                                        color: filters.armateur ? '#1d4ed8' : 'inherit',
                                    }}
                                />
                            </div>

                            {/* Combobox Etape */}
                            <div style={{ flex: '0 0 300px' }}>
                                <label>Étape du dossier</label>
                                <select name="etape" value={filters.etape} onChange={handleChange}
                                    style={{
                                        width: '100%',
                                        background: filters.etape
                                            ? (ETAPE_COLORS[filters.etape]?.bg || 'white')
                                            : 'white',
                                        color: filters.etape
                                            ? (ETAPE_COLORS[filters.etape]?.color || 'inherit')
                                            : 'inherit',
                                        fontWeight: filters.etape ? 700 : 400,
                                    }}>
                                    {ETAPES.map(e => (
                                        <option key={e.value} value={e.value}>{e.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Boutons à droite */}
                            <div style={{ flex: 1, display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                                <button type="button" onClick={() => { doReset(); window.location.reload(); }} title="Actualiser la page" className="btn-refresh">
                                    <RotateCcw size={18} />
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {loading
                                        ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Recherche...</>
                                        : <><Search size={15} /> Rechercher</>
                                    }
                                </button>
                            </div>
                        </div>

                    </form>

                    {error && (
                        <p style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                            ⚠ {error}
                        </p>
                    )}
                </section>
            </div>{/* fin zone sticky */}

            {/* Tableau des résultats */}
            {searched && (
                <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {rows.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <FileText size={40} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                            <p style={{ fontWeight: 600 }}>Aucun dossier trouvé pour ces critères.</p>
                        </div>
                    ) : (
                        <>
                            {/* Barre résumé */}
                            <div style={{
                                padding: '0.75rem 1.25rem', background: 'var(--primary-light)',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {rows.length} dossier{rows.length > 1 ? 's' : ''} trouvé{rows.length > 1 ? 's' : ''}
                                    {etapeLabel && filters.etape && (
                                        <span style={{
                                            marginLeft: '0.75rem', padding: '0.15rem 0.6rem',
                                            borderRadius: '4px', fontSize: '0.78rem',
                                            background: ETAPE_COLORS[filters.etape]?.bg || '#f1f5f9',
                                            color: ETAPE_COLORS[filters.etape]?.color || '#475569',
                                        }}>
                                            {etapeLabel}
                                        </span>
                                    )}
                                </span>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--primary)', color: 'white' }}>
                                            {['Date Réception', 'N° Facture', 'N° BL', 'Montant Caution', 'Armateur', 'Client', 'Transitaire', 'Étape courante', ''].map(h => (
                                                <th key={h} style={{
                                                    padding: '0.7rem 0.5rem', textAlign: 'left',
                                                    fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase',
                                                    letterSpacing: '0.05em', whiteSpace: 'nowrap',
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, i) => {
                                            const etape = getEtapeCourante(row);
                                            const colors = ETAPE_COLORS[etape.value] || { bg: '#f1f5f9', color: '#475569' };
                                            const bgRow = i % 2 === 0 ? 'white' : 'var(--primary-light)';
                                            return (
                                                <tr key={row.id}
                                                    style={{ background: bgRow, transition: 'background 0.15s' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = '#e0f2fe')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = bgRow)}
                                                >
                                                    <td style={{ padding: '0.55rem 0.5rem', whiteSpace: 'nowrap' }}>
                                                        {row.date_reception ? new Date(row.date_reception).toLocaleDateString('fr-FR') : '—'}
                                                    </td>
                                                    <td style={{ padding: '0.55rem 0.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                                                        {row.num_facture_caution || '—'}
                                                    </td>
                                                    <td style={{ padding: '0.55rem 0.5rem' }}>{row.num_bl || '—'}</td>
                                                    <td style={{ padding: '0.55rem 0.5rem', fontWeight: 600 }}>{fmt(row.montant_caution)}</td>
                                                    <td style={{ padding: '0.55rem 0.5rem' }}>{row.armateur || '—'}</td>
                                                    <td style={{ padding: '0.55rem 0.5rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.client_nom || ''}>{row.client_nom || '—'}</td>
                                                    <td style={{ padding: '0.55rem 0.5rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.transitaire_nom || ''}>{row.transitaire_nom || '—'}</td>
                                                    {/* Badge étape courante */}
                                                    <td style={{ padding: '0.55rem 0.5rem' }}>
                                                        {etape.value ? (
                                                            <span style={{
                                                                display: 'inline-block',
                                                                padding: '0.2rem 0.55rem',
                                                                borderRadius: '4px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                                background: colors.bg,
                                                                color: colors.color,
                                                                whiteSpace: 'nowrap',
                                                            }}>
                                                                {etape.label}
                                                            </span>
                                                        ) : '—'}
                                                    </td>
                                                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                                            <Link href={`/?facture=${row.num_facture_caution}`}
                                                                title="Ouvrir le dossier"
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center',
                                                                    fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)',
                                                                    textDecoration: 'none', padding: '0.25rem 0.45rem',
                                                                    border: '1px solid var(--border)', borderRadius: '4px',
                                                                    background: 'white',
                                                                }}>
                                                                <FileText size={14} />
                                                            </Link>

                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Boutons d'action en dessous de la liste */}
                            <div style={{ 
                                padding: '1.5rem', borderTop: '1px solid var(--border)',
                                display: 'flex', justifyContent: 'center', gap: '1rem', background: '#f8fafc'
                            }}>
                                {/* Export Excel (Toujours visible si résultats) */}
                                <button 
                                    type="button" 
                                    onClick={handleExportExcel}
                                    className="btn btn-secondary"
                                    style={{ 
                                        background: '#16a34a', color: 'white', border: 'none',
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 800,
                                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <Download size={18} /> Exporter en Excel
                                </button>

                                {/* Rapport Dossier Ligne (Conditionnel) */}
                                {((filters.etape === 'date_reception' || filters.etape === 'date_1er_signature' || filters.etape === 'date_2e_signature' || !filters.etape)) && (
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (!filters.dateFrom || !filters.dateTo) {
                                                alert("Veuillez renseigner une période (De / Au) pour générer le rapport PDF.");
                                                return;
                                            }
                                            setShowTransmissionReport(true);
                                        }}
                                        className="btn btn-secondary"
                                        style={{ 
                                            background: '#1e293b', color: 'white', border: 'none',
                                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                                            padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 800,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <Printer size={18} /> {
                                            filters.etape === 'date_1er_signature' ? 'Bordereau 1ère Signature (PDF)' :
                                            filters.etape === 'date_2e_signature' ? 'Bordereau 2ème Signature (PDF)' :
                                            'Rapport Dossier Ligne (PDF)'
                                        }
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </section>
            )}

            <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
            
            {showTransmissionReport && (
                <TransmissionReport 
                    from={filters.dateFrom}
                    to={filters.dateTo}
                    type={filters.etape === 'date_1er_signature' ? 'sig1' : filters.etape === 'date_2e_signature' ? 'sig2' : (filters.etape === 'date_reception' ? 'reception' : 'all')}
                    onClose={() => setShowTransmissionReport(false)}
                />
            )}

            <PartenaireModal
                isOpen={partenaireModal.open}
                onClose={() => setPartenaireModal({ open: false })}
                partenaireId={partenaireModal.id}
                onSaveSuccess={(p) => {
                    // Optionnel
                }}
            />
        </div>
    );
}
