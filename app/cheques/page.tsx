'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileSpreadsheet, Send, RefreshCw, CheckCircle2, AlertTriangle, CalendarDays, List, X } from 'lucide-react';
import * as XLSX from 'xlsx';

/* ── Types ───────────────────────────────────────────────── */
interface ChequeRow {
    date_liste_recu?: string;
    num_facture_caution?: string;
    num_cheque?: string;
    montant?: number | string | null;
    banque?: string;
    date_cheque?: string;
    date_rex?: string;
    beneficiaire?: string;
    commentaire?: string;
}

interface ListeInfo {
    id: string;
    label: string;
    count: number;
}

/* ── Colonnes d'affichage ────────────────────────────────── */
const COLS: { key: keyof ChequeRow; label: string }[] = [
    { key: 'num_facture_caution', label: 'N° Facture' },
    { key: 'num_cheque', label: 'N° Chèque' },
    { key: 'montant', label: 'Montant' },
    { key: 'banque', label: 'Banque' },
    { key: 'date_cheque', label: 'Date Chèque' },
    { key: 'date_rex', label: 'MANDATAIRE' },
    { key: 'beneficiaire', label: 'Bénéficiaire' },
    { key: 'commentaire', label: 'Commentaire' },
];

/* ── Page ────────────────────────────────────────────────── */
export default function ChequesPage() {
    const fileRef = useRef<HTMLInputElement>(null);
    const [dateListeRecu, setDateListeRecu] = useState('');
    const [fileName, setFileName] = useState('');
    const [rows, setRows] = useState<ChequeRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{ inserted: number; skipped: number; errors: string[] } | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    // Panneau droit : liste des dates importées
    const [listes, setListes] = useState<ListeInfo[]>([]);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [selectedListLabel, setSelectedListLabel] = useState<string | null>(null);
    const [loadingListe, setLoadingListe] = useState(false);

    /* Chargement de la liste des dates au montage */
    useEffect(() => { fetchListes(); }, []);

    const fetchListes = async () => {
        try {
            const res = await fetch('/api/cheques/listes');
            if (res.ok) setListes(await res.json());
        } catch { /* silencieux */ }
    };

    /* Parsing Excel (client-side) */
    const parseFile = useCallback((file: File) => {
        setFileName(file.name);
        setResult(null);
        setImportError(null);
        setSelectedListId(null);
        setSelectedListLabel(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target!.result as ArrayBuffer);
            const wb = XLSX.read(data, { type: 'array', cellDates: true });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

            // Normalisation des clés (insensible à la casse et aux espaces)
            const normalize = (key: string) =>
                key.toLowerCase().replace(/[\s_\-\.]/g, '');

            const mapped: ChequeRow[] = json.map(r => {
                const flat: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(r)) flat[normalize(k)] = v;

                const dateVal = (k: string) => {
                    const v = flat[k];
                    if (!v) return '';
                    if (v instanceof Date) return v.toISOString().split('T')[0];
                    return String(v);
                };

                return {
                    date_liste_recu: dateListeRecu || '',
                    num_facture_caution: String(flat['numfacture'] ?? flat['numfacturecaution'] ?? flat['facture'] ?? '').trim(),
                    num_cheque: String(flat['numcheque'] ?? flat['cheque'] ?? '').trim(),
                    montant: flat['montant'] != null ? parseFloat(String(flat['montant'])) || null : null,
                    banque: String(flat['banque'] ?? '').trim(),
                    date_cheque: dateVal('datecheque') || dateVal('datecheque'),
                    date_rex: dateVal('daterex') || dateVal('daterecep') || dateVal('daterception'),
                    beneficiaire: String(flat['beneficiaire'] ?? flat['bénéficiaire'] ?? '').trim(),
                    commentaire: String(flat['commentaire'] ?? flat['observation'] ?? '').trim(),
                };
            });

            setRows(mapped);
        };
        reader.readAsArrayBuffer(file);
    }, [dateListeRecu]);

    /* Chargement d'un fichier via click ou drag */
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) parseFile(e.target.files[0]);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        if (e.dataTransfer.files[0]) parseFile(e.dataTransfer.files[0]);
    };

    /* Import vers la BDD */
    const doImport = async () => {
        if (rows.length === 0) return;
        if (!dateListeRecu) { setImportError('Veuillez saisir une Date Liste Reçu avant d\'importer.'); return; }
        setImporting(true);
        setResult(null);
        setImportError(null);
        try {
            const payload = rows.map(r => ({ ...r, date_liste_recu: dateListeRecu }));
            const res = await fetch('/api/cheques/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await res.text());
            setResult(await res.json());
            fetchListes(); // rafraîchir le panneau droit
        } catch (err) {
            setImportError(String(err));
        } finally {
            setImporting(false);
        }
    };

    /* Clic sur une liste dans le panneau droit */
    const handleSelectList = async (list: ListeInfo) => {
        setSelectedListId(list.id);
        setSelectedListLabel(list.label);
        setLoadingListe(true);
        setRows([]);
        setFileName('');
        setResult(null);
        setImportError(null);
        try {
            const res = await fetch(`/api/cheques/listes?listId=${encodeURIComponent(list.id)}`);
            if (!res.ok) throw new Error();
            setRows(await res.json());
        } catch {
            setImportError('Impossible de charger les données pour cette liste.');
        } finally {
            setLoadingListe(false);
        }
    };

    const resetAll = () => {
        setRows([]); setFileName(''); setResult(null); setImportError(null); setSelectedListId(null); setSelectedListLabel(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    return (
        <div className="container" style={{ maxWidth: 1400 }}>

            {/* En-tête */}
            <header style={{ marginBottom: '1.5rem' }}>
                <h1 style={{
                    fontSize: '1.8rem', marginBottom: '0.2rem',
                    background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                    Chèques Émis
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Chargez la liste Excel des chèques émis par la comptabilité et déversez-la dans la base de données.
                </p>
            </header>

            {/* Layout 2 colonnes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2.5rem', alignItems: 'start' }}>

                {/* ── COLONNE GAUCHE ──────────────────────────────── */}
                <div>
                    {/* Zone de saisie + upload */}
                    <section className="card" style={{ marginBottom: '1rem', borderTop: '4px solid var(--accent)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>

                            {/* DateListeRecu */}
                            <div>
                                <label>Date Liste Reçu</label>
                                <input
                                    type={dateListeRecu ? "date" : "text"}
                                    value={dateListeRecu}
                                    onChange={e => setDateListeRecu(e.target.value)}
                                    onFocus={(e) => (e.target.type = "date")}
                                    onBlur={(e) => !dateListeRecu && (e.target.type = "text")}
                                    placeholder="JJ/MM/AAAA"
                                    style={{ fontWeight: 700 }}
                                />
                            </div>

                            {/* Zone drag & drop */}
                            <div
                                onClick={() => fileRef.current?.click()}
                                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleDrop}
                                style={{
                                    border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
                                    borderRadius: '4px',
                                    padding: '0.75rem 1rem',
                                    cursor: 'pointer',
                                    background: dragging ? '#f0f9ff' : 'var(--primary-light)',
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    transition: 'all 0.2s',
                                }}>
                                <FileSpreadsheet size={22} color="var(--accent)" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                        {fileName || 'Glissez le fichier Excel ici ou cliquez pour choisir'}
                                    </div>
                                    {fileName && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {rows.length} ligne{rows.length > 1 ? 's' : ''} détectée{rows.length > 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                                <Upload size={18} color="var(--text-muted)" />
                                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFile} />
                            </div>
                        </div>

                        {/* Boutons */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {(rows.length > 0 || result) && (
                                <button className="btn btn-secondary" onClick={resetAll}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                                    <X size={14} /> Réinitialiser
                                </button>
                            )}
                            {rows.length > 0 && !selectedListId && (
                                <button className="btn btn-primary" onClick={doImport} disabled={importing}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 1.2rem' }}>
                                    {importing
                                        ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Import en cours...</>
                                        : <><Send size={14} /> Déverser dans la base ({rows.length} lignes)</>
                                    }
                                </button>
                            )}
                        </div>

                        {/* Messages */}
                        {importError && (
                            <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '4px', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <AlertTriangle size={16} /> {importError}
                            </div>
                        )}
                        {result && (
                            <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#15803d', marginBottom: '0.25rem' }}>
                                    <CheckCircle2 size={16} /> Import terminé
                                </div>
                                <div style={{ color: '#374151' }}>
                                    ✅ <strong>{result.inserted}</strong> insérés &nbsp;|&nbsp; ⏭ <strong>{result.skipped}</strong> ignorés
                                    {result.errors.length > 0 && (
                                        <span style={{ color: '#b91c1c' }}> &nbsp;|&nbsp; ⚠ {result.errors.length} erreur(s)</span>
                                    )}
                                </div>
                                {result.errors.slice(0, 5).map((e, i) => (
                                    <div key={i} style={{ color: '#b91c1c', fontSize: '0.78rem', marginTop: '0.2rem' }}>• {e}</div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Tableau de prévisualisation / consultation */}
                    {rows.length > 0 && (
                        <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '0.65rem 1rem', background: 'var(--primary-light)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    {selectedListId
                                        ? <>Import : <strong>{selectedListLabel}</strong> — {rows.length} ligne{rows.length > 1 ? 's' : ''}</>
                                        : <>{rows.length} ligne{rows.length > 1 ? 's' : ''} — <em>Aperçu avant import</em></>
                                    }
                                </span>
                            </div>
                            <div className="hide-scrollbar" style={{ overflowX: 'auto', maxHeight: '55vh', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead style={{ position: 'sticky', top: 0 }}>
                                        <tr style={{ background: 'var(--primary)', color: 'white' }}>
                                            {COLS.map(c => (
                                                <th key={c.key} style={{ padding: '0.6rem 0.8rem', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                                                    {c.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, i) => (
                                            <tr key={i} style={{ background: i % 2 === 0 ? 'white' : 'var(--primary-light)' }}>
                                                {COLS.map(c => (
                                                    <td key={c.key} style={{ padding: '0.45rem 0.8rem', whiteSpace: 'nowrap', fontWeight: c.key === 'num_facture_caution' ? 700 : 400, color: c.key === 'num_facture_caution' ? 'var(--accent)' : 'inherit' }}>
                                                        {row[c.key] != null && row[c.key] !== '' ? String(row[c.key]) : <span style={{ color: '#cbd5e1' }}>—</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>

                {/* ── COLONNE DROITE : historique des listes ─────── */}
                <aside className="card" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: '1rem' }}>
                    <div style={{ padding: '0.75rem 1rem', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <List size={16} />
                        <span style={{ fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Chèques Disponibles
                        </span>
                    </div>

                    {listes.length === 0 ? (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            <CalendarDays size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                            <p>Aucune liste importée</p>
                        </div>
                    ) : (
                        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {listes.map((l) => {
                                const isActive = selectedListId === l.id;
                                return (
                                    <button
                                        key={l.id}
                                        onClick={() => handleSelectList(l)}
                                        style={{
                                            width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                                            padding: '0.65rem 1rem',
                                            borderBottom: '1px solid var(--border)',
                                            background: isActive ? 'var(--accent)' : 'transparent',
                                            color: isActive ? 'white' : 'var(--text-main)',
                                            transition: 'background 0.15s',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--primary-light)'; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.83rem' }}>{l.label}</div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.72rem', fontWeight: 700,
                                            background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--primary-light)',
                                            color: isActive ? 'white' : 'var(--text-muted)',
                                            padding: '0.1rem 0.5rem', borderRadius: '4px',
                                        }}>
                                            {l.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {loadingListe && (
                        <div style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                        </div>
                    )}
                </aside>

            </div>

            <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
