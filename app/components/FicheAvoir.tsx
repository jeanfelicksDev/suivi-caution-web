'use client';

import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';

interface Dossier {
    id?: number;
    num_facture_caution?: string | null;
    montant_caution?: number | null;
    montant_final?: number | null;
    date_facture?: string | null;
    date_cheque?: string | null;
    transitaire_actif?: number | null;
    transitaire_nom?: string | null;
    client_actif?: number | null;
    client_nom?: string | null;
    mandataire_nom?: string | null;
    mandataire_piece_id?: string | null;
    propose_par?: string | null;
    commentaire_validation?: string | null;
    num_avoir?: string | null;
    nature_rembt?: string | null;
    type_rembt?: string | null;
    armateur?: string | null;
    num_bl?: string | null;
}

interface Props {
    dossier: Dossier;
    onClose: () => void;
}

function fmt(dateStr: string | null | undefined): string {
    if (!dateStr) return '___/___/______';
    try {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    } catch { return dateStr; }
}

function fmtMontant(v: number | null | undefined): string {
    if (v == null) return '—';
    return v.toLocaleString('fr-FR') + ' F CFA';
}

function today(): string {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Détermine le nom principal (transitaire actif ou client actif)
function getNomPrincipal(dossier: Dossier): string {
    if (dossier.transitaire_actif === 1 && dossier.transitaire_nom) return dossier.transitaire_nom;
    if (dossier.client_actif === 1 && dossier.client_nom) return dossier.client_nom;
    return dossier.transitaire_nom || dossier.client_nom || '—';
}

// Détermine le motif coché
function getMotif(dossier: Dossier): 'erreur' | 'commerciale' | 'reclamation' | 'autre' {
    const n = (dossier.nature_rembt || '').toLowerCase();
    if (n.includes('erreur')) return 'erreur';
    if (n.includes('commercial') || n.includes('ristourne')) return 'commerciale';
    if (n.includes('reclamation') || n.includes('réclamation')) return 'reclamation';
    return 'autre';
}

// Détermine l'action proposée
function getAction(dossier: Dossier): 'avoir_total' | 'autre' {
    // Si montant_final == montant_caution => avoir total
    if (dossier.montant_final && dossier.montant_caution &&
        Math.abs(dossier.montant_final - dossier.montant_caution) < 1) {
        return 'avoir_total';
    }
    if (!dossier.montant_final && dossier.montant_caution) return 'avoir_total';
    return 'autre';
}

const CB = ({ checked }: { checked: boolean }) => (
    <span style={{
        display: 'inline-block', width: 14, height: 14,
        border: '1.5px solid #333',
        marginRight: 6, verticalAlign: 'middle',
        textAlign: 'center', lineHeight: '12px', fontSize: 11,
        fontWeight: 900,
    }}>
        {checked ? 'X' : ''}
    </span>
);

export default function FicheAvoir({ dossier, onClose }: Props) {
    const printRef = useRef<HTMLDivElement>(null);

    const motif = getMotif(dossier);
    const action = getAction(dossier);
    const montant = dossier.montant_final || dossier.montant_caution;
    const nomClient = getNomPrincipal(dossier);

    const handlePrint = () => {
        const content = printRef.current?.innerHTML || '';
        const win = window.open('', '_blank', 'width=800,height=1000');
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Fiche Avoir – ${dossier.num_facture_caution}</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: white; }
                    @media print { body { margin: 0; } @page { margin: 10mm; } }
                </style>
            </head>
            <body onload="window.print();window.close()">
                ${content}
            </body>
            </html>
        `);
        win.document.close();
    };

    const cellStyle: React.CSSProperties = {
        border: '1px solid #333',
        padding: '6px 8px',
        verticalAlign: 'top',
    };

    const sectionHeader: React.CSSProperties = {
        background: '#e8e8e8',
        border: '1px solid #333',
        padding: '5px 8px',
        fontWeight: 700,
        fontSize: 11,
        textTransform: 'uppercase' as const,
        marginTop: 8,
    };

    const validationRow: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        border: '1px solid #333',
        borderTop: 'none',
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
        }}>
            <div style={{
                background: 'white', borderRadius: 8, width: '100%', maxWidth: 720,
                maxHeight: '92vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}>
                {/* Barre d'actions */}
                <div style={{
                    padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', borderBottom: '1px solid #e2e8f0',
                    background: '#f8fafc',
                }}>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>
                        Fiche de Gestion des Avoirs — {dossier.num_facture_caution}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handlePrint} style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            background: '#1e3a5f', color: 'white', border: 'none',
                            borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer',
                            fontWeight: 700, fontSize: '0.85rem',
                        }}>
                            <Printer size={16} /> Imprimer
                        </button>
                        <button onClick={onClose} style={{
                            background: 'none', border: '1px solid #e2e8f0',
                            borderRadius: 6, padding: '0.5rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center',
                        }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Contenu scrollable */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    <div ref={printRef} style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#000', maxWidth: 680, margin: '0 auto' }}>
                        <div style={{ textAlign: 'right', fontSize: '8px', color: '#666', marginBottom: '4px', fontWeight: 400 }}>
                            Suivi-caution-Dsm 2.0 est une application web entierement dévéloppé par Jean-Félix ZIAGOUE (Agent AGL-OOCL/DSM)
                        </div>

                        {/* ── EN-TÊTE ── */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #333', marginBottom: 4 }}>
                            <tbody>
                                <tr>
                                    <td style={{ ...cellStyle, width: '30%', border: '2px solid #333', textAlign: 'center', padding: 8 }}>
                                        <div style={{ fontWeight: 900, fontSize: 20, color: '#0044aa', letterSpacing: 2 }}>AGL</div>
                                        <div style={{ fontSize: 8, color: '#555', marginTop: 2 }}>AFRICA GLOBAL LOGISTICS</div>
                                    </td>
                                    <td style={{ ...cellStyle, border: '2px solid #333', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 900, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                                            Fiche de Gestion des Avoirs
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* ── IDENTITÉ DOSSIER ── */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333' }}>
                            <tbody>
                                <tr>
                                    <td style={{ ...cellStyle, width: '45%' }}>
                                        DOSSIER N° :
                                    </td>
                                    <td style={{ ...cellStyle }}>
                                        FACTURE N° : <strong style={{ fontSize: 13 }}>{dossier.num_facture_caution}</strong>
                                        &nbsp;&nbsp;&nbsp; Du : <strong>{fmt(dossier.date_facture)}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ ...cellStyle }}>
                                        NOM DU CLIENT : <strong>{nomClient}</strong>
                                    </td>
                                    <td style={{ ...cellStyle }}>
                                        N° BL : {dossier.num_bl || '—'} &nbsp;|&nbsp; ARMATEUR : {dossier.armateur || '—'}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={2} style={{ ...cellStyle }}>
                                        NUMERO DE COMPTE :
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* ── MOTIF ── */}
                        <div style={{ ...sectionHeader }}>MOTIF DE LA DEMANDE D'AVOIR :</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333', borderTop: 'none' }}>
                            <tbody>
                                <tr>
                                    <td style={{ ...cellStyle, width: '50%' }}>
                                        <CB checked={motif === 'erreur'} /> ERREUR INTERNE DE FACTURATION
                                    </td>
                                    <td style={{ ...cellStyle }}>
                                        NUMERO D'AVOIR : <strong style={{ fontSize: 12 }}>{dossier.num_avoir || '—'}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ ...cellStyle }}>
                                        <CB checked={motif === 'commerciale'} /> ACTION COMMERCIALE / RISTOURNE
                                    </td>
                                    <td rowSpan={3} style={{ ...cellStyle, verticalAlign: 'middle' }}>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ ...cellStyle }}>
                                        <CB checked={motif === 'reclamation'} /> RECLAMATION CLIENT
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ ...cellStyle }}>
                                        <CB checked={motif === 'autre'} /> AUTRE (précisez) :{' '}
                                        {motif === 'autre' ? <em>{dossier.commentaire_validation || ''}</em> : ''}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* ── ACTION PROPOSÉE ── */}
                        <div style={{ ...sectionHeader }}>ACTION PROPOSEE: DEMANDE DE REMBOURSEMENT CAUTION</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333', borderTop: 'none' }}>
                            <tbody>
                                <tr>
                                    <td style={{ ...cellStyle, width: '40%' }}>
                                        <CB checked={action === 'avoir_total'} /> AVOIR TOTAL
                                    </td>
                                    <td style={{ ...cellStyle }}>
                                        <CB checked={action === 'autre'} /> AUTRE (précisez) :
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* ── MONTANT / INFO ── */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333', borderTop: 'none', marginBottom: 4 }}>
                            <tbody>
                                <tr>
                                    <td style={{ ...cellStyle, width: '55%' }}>
                                        <div><strong>MONTANT : <span style={{ fontSize: 13 }}>{fmtMontant(montant)}</span></strong></div>
                                        <div style={{ marginTop: 6 }}>IMPACT SUR MARGE:</div>
                                        <div style={{ marginTop: 6 }}>Proposée par : <strong>{dossier.propose_par || '—'}</strong></div>
                                        <div style={{ marginTop: 6 }}>
                                            Commentaires : <em>{dossier.commentaire_validation || '—'}</em>
                                        </div>
                                    </td>
                                    <td style={{ ...cellStyle, textAlign: 'right', verticalAlign: 'top' }}>
                                        <div>{dossier.propose_par || ''}</div>
                                        <div>{today()}</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* ── VALIDATION 1 : COM ── */}
                        <div style={{ ...sectionHeader }}>CONTROLE CLIENT OPERRATION MANAGER (COM)</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333', borderTop: 'none', marginBottom: 4 }}>
                            <tbody>
                                <tr>
                                    <td style={{ ...cellStyle, width: '50%' }}>
                                        <div style={{ marginBottom: 8 }}>
                                            <CB checked={false} /> ACCEPTEE &nbsp;&nbsp;&nbsp; <CB checked={false} /> REFUSEE
                                        </div>
                                        <div>Commentaires:</div>
                                        <div style={{ marginTop: 20 }}></div>
                                        <div style={{ marginTop: 4 }}>DATE DE VALIDATION : ___/___/______</div>
                                    </td>
                                    <td style={{ ...cellStyle, textAlign: 'center', verticalAlign: 'bottom', paddingBottom: 8 }}>
                                        VISA (Nom, tampon et signature)
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* ── VALIDATION 2 : Chef Dépt ── */}
                        <div style={{ ...sectionHeader }}>VALIDATION DE L'AVOIR (CHEF DE DEPARTEMENT/SOUS DIRECTEUR/DIRECTEUR)</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333', borderTop: 'none', marginBottom: 4 }}>
                            <tbody>
                                <tr>
                                    <td style={{ ...cellStyle, width: '50%' }}>
                                        <div style={{ marginBottom: 8 }}>
                                            <CB checked={false} /> ACCEPTEE &nbsp;&nbsp;&nbsp; <CB checked={false} /> REFUSEE
                                        </div>
                                        <div>Commentaires:</div>
                                        <div style={{ marginTop: 20 }}></div>
                                        <div style={{ marginTop: 4 }}>DATE DE VALIDATION : ___/___/______</div>
                                    </td>
                                    <td style={{ ...cellStyle, textAlign: 'center', verticalAlign: 'bottom', paddingBottom: 8 }}>
                                        VISA (Nom, tampon et signature)
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* ── VALIDATION 3 : Direction Financière ── */}
                        <div style={{ ...sectionHeader }}>VALIDATION DE L'AVOIR (DIRECTION FINANCIERE)</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333', borderTop: 'none' }}>
                            <tbody>
                                <tr>
                                    <td style={{ ...cellStyle, width: '50%' }}>
                                        <div style={{ marginBottom: 8 }}>
                                            <CB checked={false} /> ACCEPTEE &nbsp;&nbsp;&nbsp; <CB checked={false} /> REFUSEE
                                        </div>
                                        <div>Commentaires:</div>
                                        <div style={{ marginTop: 20 }}></div>
                                        <div style={{ marginTop: 4 }}>DATE DE VALIDATION : ___/___/______</div>
                                    </td>
                                    <td style={{ ...cellStyle, textAlign: 'center', verticalAlign: 'bottom', paddingBottom: 8 }}>
                                        VISA (Nom, tampon et signature)
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                    </div>
                </div>
            </div>
        </div>
    );
}
