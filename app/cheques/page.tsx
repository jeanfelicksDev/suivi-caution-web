'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileSpreadsheet, Send, RefreshCw, CheckCircle2, AlertTriangle, CalendarDays, List, X, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../components/AuthProvider';

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
    const { user } = useAuth();
    const perms = Array.isArray(user?.permissions) ? user?.permissions : [];
    const isAdmin = user?.role === 'ADMIN';
    const canWriteCheque = isAdmin || perms.includes('CHEQUE_WRITE');

    /* Synchronisation de la date des lignes avec la date de la liste sélectionnée */
    useEffect(() => {
        if (!selectedListId && rows.length > 0 && dateListeRecu) {
            setRows(prev => prev.map(r => ({
                ...r,
                date_cheque: dateListeRecu,
                date_liste_recu: dateListeRecu
            })));
        }
    }, [dateListeRecu, selectedListId]);

    /* Chargement de la liste des dates au montage */
    useEffect(() => { fetchListes(); }, []);

    const fetchListes = async () => {
        try {
            const res = await fetch('/api/cheques/listes');
            if (res.ok) {
                const data = await res.json();
                console.log('Fetched listes:', data);
                setListes(data);
            } else {
                console.error('Fetch listes failed:', res.status, await res.text());
            }
        } catch (err) {
            console.error('Fetch listes error:', err);
        }
    };

    /* Parsing Excel (client-side) */
    const parseFile = useCallback(async (file: File) => {
        setFileName(file.name);
        setResult(null);
        setImportError(null);
        setSelectedListId(null);
        setSelectedListLabel(null);

        // Si PDF, on passe par l'API de parsing
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await fetch('/api/cheques/parse-pdf', {
                    method: 'POST',
                    body: formData,
                });
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                const chequesWithDate = (data.cheques || []).map((c: any) => ({
                    ...c,
                    date_cheque: dateListeRecu || '',
                    date_liste_recu: dateListeRecu || ''
                }));
                setRows(chequesWithDate);
            } catch (err) {
                setImportError(`Erreur lors du parsing PDF: ${String(err)}`);
            }
            return;
        }

        // Sinon (Excel/CSV), on garde la logique client
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
                    date_cheque: dateVal('datecheque') || dateListeRecu || '',
                    date_rex: String(flat['mandataire'] ?? flat['nommandataire'] ?? flat['daterex'] ?? '').trim(),
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
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': user?.id.toString() || ''
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data);

            // Gérer les rejets (lignes dont la facture n'existe pas)
            if (data.rejected && data.rejected.length > 0) {
                const header = `RAPPORT D'IMPORTATION DES CHEQUES DU ${new Date().toLocaleDateString()}\n`;
                const subHeader = `Chèques ignorés car le dossier n'existe pas dans la base de données :\n`;
                const content = data.rejected.map((r: any) => 
                    `- Facture: ${r.num_facture} | Chèque: ${r.num_cheque ?? 'N/A'} | Montant: ${r.montant ?? 'N/A'} | Motif: ${r.motif}`
                ).join('\n');
                
                const blob = new Blob([header + subHeader + content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `chèques_rejetés_${dateListeRecu || 'import'}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

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

    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    /* Suppression d'une liste entière */
    const handleDeleteList = async (e: React.MouseEvent, list: ListeInfo) => {
        e.stopPropagation();
        
        if (deleteConfirmId !== list.id) {
            setDeleteConfirmId(list.id);
            // Auto-reset après 3 secondes si pas de confirmation
            setTimeout(() => setDeleteConfirmId(null), 3000);
            return;
        }

        setDeleteConfirmId(null);
        
        try {
            const res = await fetch(`/api/cheques/listes?listId=${encodeURIComponent(list.id)}`, { 
                method: 'DELETE',
                headers: { 'x-user-id': user?.id.toString() || '' }
            });
            if (res.ok) {
                // Mise à jour optimiste de l'interface
                setListes(prev => prev.filter(l => l.id !== list.id));
                
                if (selectedListId === list.id) {
                    setSelectedListId(null);
                    setSelectedListLabel(null);
                    setRows([]);
                }
            } else {
                const errData = await res.json();
                alert(`Erreur lors de la suppression : ${errData.error || 'Erreur inconnue'}`);
            }
        } catch {
            alert('Erreur réseau.');
        }
    };

    /* Suppression d'une ligne précise */
    const handleDeleteRow = async (index: number) => {
        const row = rows[index];
        if (!selectedListId) {
            const newRows = [...rows];
            newRows.splice(index, 1);
            setRows(newRows);
            return;
        }

        if (!confirm('Supprimer ce chèque de la base de données ?')) return;

        try {
            // @ts-ignore
            const id = (row as any).id;
            if (!id) {
                 const newRows = [...rows];
                 newRows.splice(index, 1);
                 setRows(newRows);
                 return;
            }

            const res = await fetch(`/api/cheques/listes?id=${id}`, { 
                method: 'DELETE',
                headers: { 'x-user-id': user?.id.toString() || '' }
            });
            if (res.ok) {
                const newRows = [...rows];
                newRows.splice(index, 1);
                setRows(newRows);
            } else {
                alert('Erreur suppression ligne.');
            }
        } catch {
            alert('Erreur réseau.');
        }
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
                    Chargez la liste PDF ou Excel des chèques émis par la comptabilité et déversez-la dans la base de données.
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
                                    onClick={() => canWriteCheque && fileRef.current?.click()}
                                    onDragOver={e => { e.preventDefault(); canWriteCheque && setDragging(true); }}
                                    onDragLeave={() => setDragging(false)}
                                    onDrop={handleDrop}
                                    style={{
                                        border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
                                        borderRadius: '4px',
                                        padding: '0.75rem 1rem',
                                        cursor: canWriteCheque ? 'pointer' : 'not-allowed',
                                        background: dragging ? '#f0f9ff' : 'var(--primary-light)',
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        transition: 'all 0.2s',
                                        opacity: canWriteCheque ? 1 : 0.6
                                    }}>
                                    <FileSpreadsheet size={22} color="var(--accent)" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                            {!canWriteCheque ? 'Lecture seule (Importation désactivée)' : (fileName || 'Glissez le fichier PDF ou Excel ici ou cliquez pour choisir')}
                                        </div>
                                        {fileName && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {rows.length} ligne{rows.length > 1 ? 's' : ''} détectée{rows.length > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                    <Upload size={18} color="var(--text-muted)" />
                                    <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFile} disabled={!canWriteCheque} />
                                </div>
                            </div>

                            {/* Boutons */}
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                {(rows.length > 0 || result) && (
                                    <button className="btn btn-secondary" onClick={resetAll}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                                        <X size={14} /> {canWriteCheque ? 'Réinitialiser' : 'Fermer la vue'}
                                    </button>
                                )}
                                {rows.length > 0 && !selectedListId && canWriteCheque && (
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={doImport} 
                                        disabled={importing || !dateListeRecu}
                                        style={{ 
                                            display: 'flex', alignItems: 'center', gap: '0.4rem', 
                                            fontSize: '0.85rem', padding: '0.4rem 1.2rem',
                                            opacity: (!dateListeRecu || importing) ? 0.5 : 1,
                                            cursor: (!dateListeRecu || importing) ? 'not-allowed' : 'pointer'
                                        }}
                                        title={!dateListeRecu ? "Veuillez renseigner la Date Liste Reçu avant de déverser dans la base" : ""}
                                    >
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

                    {/* Tableau uniquement si consultation (selectedListId) ou après import réussi (result) */}
                    {(selectedListId || (result && rows.length > 0)) && (
                        <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '0.65rem 1rem', background: 'var(--primary-light)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    {selectedListId
                                        ? <>Import : <strong>{selectedListLabel}</strong> — {rows.length} ligne{rows.length > 1 ? 's' : ''}</>
                                        : <>{rows.length} ligne{rows.length > 1 ? 's' : ''} — <em>Données importées</em></>
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
                                            <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', width: 50 }}>
                                                {canWriteCheque ? 'Actions' : ''}
                                            </th>
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
                                                <td style={{ padding: '0.45rem 0.8rem', textAlign: 'center' }}>
                                                    {canWriteCheque && (
                                                        <button 
                                                            onClick={() => handleDeleteRow(i)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.6, transition: 'opacity 0.2s' }}
                                                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                                            onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                                                            title="Supprimer la ligne"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </td>
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
                    <div style={{ padding: '0.75rem 1rem', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <List size={16} />
                            <span style={{ fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Chèques Disponibles
                            </span>
                        </div>
                        <button 
                            onClick={() => fetchListes()} 
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
                            title="Actualiser la liste"
                        >
                            <RefreshCw size={14} />
                        </button>
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
                                    <div
                                        key={l.id}
                                        style={{
                                            width: '100%', borderBottom: '1px solid var(--border)',
                                            background: isActive ? 'var(--accent)' : 'transparent',
                                            transition: 'background 0.15s',
                                            display: 'flex', alignItems: 'center',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--primary-light)'; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <button
                                            onClick={() => handleSelectList(l)}
                                            style={{
                                                flex: 1, textAlign: 'left', border: 'none', cursor: 'pointer',
                                                padding: '0.65rem 0.5rem 0.65rem 1rem',
                                                background: 'transparent',
                                                color: isActive ? 'white' : 'var(--text-main)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            }}
                                        >
                                            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

                                            {canWriteCheque && (
                                                <button 
                                                    onClick={(e) => handleDeleteList(e, l)}
                                                    style={{ 
                                                        background: 'none', border: 'none', cursor: 'pointer', 
                                                        color: isActive ? 'white' : '#ef4444', 
                                                        padding: '0.65rem 0.75rem', 
                                                        display: 'flex', alignItems: 'center',
                                                        opacity: 0.8,
                                                        transition: 'all 0.2s',
                                                        zIndex: 10
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.opacity = '1';
                                                        e.currentTarget.style.transform = 'scale(1.2)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.opacity = '0.8';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                    title="Supprimer toute la liste"
                                                >
                                                    {deleteConfirmId === l.id ? (
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f87171' }}>Confirmer ?</span>
                                                    ) : (
                                                        <Trash2 size={16} />
                                                    )}
                                                </button>
                                            )}
                                    </div>
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
