'use client';

import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { useAuth } from '@/app/components/AuthProvider';

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
    num_fne?: string | null;
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

    const { user } = useAuth();
    const motif = getMotif(dossier);
    const action = getAction(dossier);
    const montant = dossier.montant_caution;
    const nomClient = getNomPrincipal(dossier);
    const proposePar = dossier.propose_par || user?.username || '—';

    const handlePrint = () => {
        const content = printRef.current?.innerHTML || '';
        const win = window.open('', '_blank', 'width=800,height=1000');
        if (!win) return;
        
        // Supprime le "about:blank" de la barre d'adresse et de l'impression PDF (Pied de page et nom du fichier)
        win.document.title = "Suivi_caution_Web 2.0";
        try { win.history.replaceState(null, "Suivi_caution_Web 2.0", "Suivi_caution_Web_2.0"); } catch (e) {}

        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Suivi_caution_Web 2.0</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; background: white; }
                    @media print { 
                        @page { margin: 0; } /* Supprime les en-têtes et pieds de page par défaut du navigateur (about:blank) */
                        body { margin: 0; padding: 10mm; } 
                        .print-wrapper { width: 100% !important; max-width: none !important; }
                    }
                </style>
            </head>
            <body onload="window.print();window.close()">
                ${content}
            </body>
            </html>
        `);
        win.document.close();
    };

    /* Case à cocher rectangulaire identique au PDF */
    const Sq = ({ checked }: { checked: boolean }) => (
        <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '30px', height: '20px', border: '1.5px solid #000',
            marginRight: '8px', verticalAlign: 'middle', fontWeight: 'bold',
            fontSize: '14px', lineHeight: '18px',
        }}>
            {checked ? 'X' : '\u00A0'}
        </span>
    );

    /* Styles réutilisables */
    const fs11: React.CSSProperties = { fontSize: '11px' };

    /* ── Couleurs du thème ── */
    const NAVY = '#1B2E4B';
    const ACCENT = '#1e6fbf';
    const LIGHT_BLUE = '#e8f1fb';
    const BORDER = '#2c2c2c';

    /* ── Entête de section (aperçu uniquement, remplacé à l'impression) ── */
    const SectionLabel = ({ children, color = NAVY }: { children: React.ReactNode; color?: string }) => (
        <div style={{
            fontWeight: 700, fontSize: '10.5px', letterSpacing: '0.4px',
            color, marginBottom: '8px',
            paddingLeft: '4px', borderLeft: `3px solid ${color}`,
        }}>{children}</div>
    );

    return (
        /* ── Overlay ── */
        <div style={{
            position: 'fixed', inset: 0,
            background: 'linear-gradient(135deg, rgba(10,20,40,0.75), rgba(0,30,80,0.65))',
            zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', backdropFilter: 'blur(3px)',
        }}>

            {/* ── Carte principale ── */}
            <div style={{
                background: '#f0f4f8',
                borderRadius: 12, width: '100%', maxWidth: 870,
                maxHeight: '96vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
                overflow: 'hidden',
            }}>

                {/* ── Barre de titre premium ── */}
                <div style={{
                    background: `linear-gradient(135deg, ${NAVY} 0%, #2a4a7f 100%)`,
                    padding: '1rem 1.25rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Icône document */}
                        <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: 'rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                            </svg>
                        </div>
                        <div>
                            <div style={{ color: 'white', fontWeight: 700, fontSize: '15px', letterSpacing: '0.3px' }}>
                                Fiche de Gestion des Avoirs
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', marginTop: '1px' }}>
                                {dossier.num_facture_caution} — {nomClient}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* Badge montant */}
                        <div style={{
                            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: 20, padding: '4px 12px',
                            color: 'white', fontSize: '12px', fontWeight: 600,
                            marginRight: '8px',
                        }}>
                            {fmtMontant(montant)}
                        </div>
                        <button onClick={handlePrint} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: ACCENT, color: 'white', border: 'none',
                            borderRadius: 7, padding: '8px 16px', cursor: 'pointer',
                            fontWeight: 700, fontSize: '13px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                            transition: 'opacity 0.2s',
                        }}>
                            <Printer size={15} /> Imprimer
                        </button>
                        <button onClick={onClose} style={{
                            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: 7, padding: '8px 10px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', color: 'white',
                        }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Zone scrollable ── */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: '1.5rem 2rem',
                    display: 'flex', justifyContent: 'center',
                    background: 'linear-gradient(180deg, #e8edf5 0%, #f0f4f8 100%)',
                }}>

                    {/* ═══ Document A4 — version impression ═══ */}
                    <div ref={printRef} className="print-wrapper" style={{
                        width: '100%', maxWidth: '720px',
                        fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', color: '#000',
                        background: '#fff', display: 'flex', flexDirection: 'column',
                        minHeight: '1050px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                        borderRadius: '2px',
                    }}>

                        {/* ── Date d'impression ── */}
                        <div style={{
                            display: 'flex', justifyContent: 'flex-end',
                            padding: '6px 4px 4px 4px',
                            fontSize: '10px', color: '#555', fontStyle: 'italic',
                        }}>
                            Imprimé le : <strong style={{ marginLeft: 4, fontStyle: 'normal', color: '#222' }}>{today()}</strong>
                        </div>

                        {/* ╔══════════ BLOC PRINCIPAL ══════════╗ */}
                        <div style={{ border: `3px solid ${BORDER}` }}>

                            {/* ── EN-TÊTE ── */}
                            <div style={{ display: 'flex', borderBottom: `3px solid ${BORDER}`, background: '#fff' }}>
                                <div style={{
                                    width: '30%', borderRight: `3px solid ${BORDER}`,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    padding: '10px',
                                    background: 'linear-gradient(180deg, #f7faff 0%, #eef3fa 100%)',
                                }}>
                                    <img src="/logo-agl.png" alt="AGL" style={{ maxWidth: '100%', maxHeight: '70px', objectFit: 'contain' }} />
                                </div>
                                <div style={{
                                    width: '70%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
                                    background: '#fff',
                                }}>
                                    <span style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.5px', color: NAVY }}>FICHE DE GESTION DES AVOIRS</span>
                                </div>
                            </div>

                            {/* ── IDENTITÉ DOSSIER ── */}
                            <div style={{
                                padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '8px',
                                borderBottom: `2px solid ${BORDER}`,
                                background: LIGHT_BLUE,
                                minHeight: '80px',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ width: '33%' }}>DOSSIER N° :</span>
                                    <span style={{ width: '33%', textAlign: 'center', fontWeight: 700 }}>FACTURE N° : <strong style={{ fontSize: '13px' }}>{dossier.num_facture_caution}</strong></span>
                                    <span style={{ width: '33%', textAlign: 'right' }}>Du : <strong>{fmt(dossier.date_facture)}</strong></span>
                                </div>
                                <div>
                                    NOM DU CLIENT : &nbsp;&nbsp;<strong style={{ fontSize: '13px' }}>{nomClient}</strong>
                                </div>
                                <div>
                                    NUMERO DE COMPTE : &nbsp;&nbsp;<strong style={{ fontSize: '13px' }}>{(!dossier.num_fne || dossier.num_fne.includes('VIDE-')) ? 'NX000015' : dossier.num_fne}</strong>
                                </div>
                            </div>

                            {/* ── MOTIF DE LA DEMANDE D'AVOIR ── */}
                            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, background: '#fff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <strong>MOTIF DE LA DEMANDE D'AVOIR :</strong>
                                    <span style={{ marginRight: '20px' }}>NUMERO D'AVOIR : <strong style={{ fontSize: '13px' }}>{dossier.num_avoir || ''}</strong></span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', paddingLeft: '12px' }}>
                                    {[
                                        { key: 'erreur', label: 'ERREUR INTERNE DE FACTURATION' },
                                        { key: 'commerciale', label: 'ACTION COMMERCIALE / RISTOURNE' },
                                        { key: 'reclamation', label: 'RECLAMATION CLIENT' },
                                        { key: 'autre', label: 'AUTRE (précisez)' },
                                    ].map(({ key, label }) => (
                                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Sq checked={motif === key} />
                                            <span style={{ fontWeight: motif === key ? 700 : 400 }}>{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── ACTION PROPOSÉE ── */}
                            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, background: '#fafcff' }}>
                                <div style={{ marginBottom: '10px', fontWeight: 700 }}>ACTION PROPOSEE: DEMANDE DE REMBOURSEMENT CAUTION</div>
                                <div style={{ display: 'flex', gap: '40px', paddingLeft: '12px', alignItems: 'center' }}>
                                    {[
                                        { key: 'avoir_total', label: 'AVOIR TOTAL' },
                                        { key: 'autre', label: 'AUTRE (précisez)' },
                                    ].map(({ key, label }) => (
                                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Sq checked={action === key} />
                                            <span style={{ fontWeight: action === key ? 700 : 400 }}>{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── MONTANT / COMMENTAIRES ── */}
                            <div style={{
                                padding: '20px 14px', display: 'flex', justifyContent: 'space-between',
                                background: '#fff',
                                minHeight: '110px',
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                    <div>MONTANT: &nbsp;<strong style={{ fontSize: '14px' }}>{fmtMontant(montant)}</strong></div>
                                    <div>IMPACT SUR MARGE:</div>
                                    <div>Proposée par : &nbsp;<strong>{proposePar}</strong></div>
                                    <div>Commentaires : &nbsp;<strong style={{ textTransform: 'uppercase' }}>{dossier.commentaire_validation || 'ANNULATION DE LA CAUTION'}</strong></div>
                                </div>

                            </div>

                        </div>
                        {/* ╚══════════ FIN BLOC PRINCIPAL ══════════╝ */}

                        {/* ── Justificatifs ── */}
                        <div style={{ padding: '6px 4px 10px 4px', fontStyle: 'italic', fontSize: '10px' }}>
                            (Joindre les éléments justificatifs de l'action proposée)
                        </div>

                        {/* ── BLOCS DE VALIDATION ── */}
                        {([
                            { title: 'CONTROLE CLIENT OPERRATION MANAGER (COM)', color: '#1B4F72' },
                            { title: "VALIDATION DE L'AVOIR (CHEF DE DEPARTEMENT/SOUS DIRECTEUR/DIRECTEUR)", color: '#1E5631' },
                            { title: "VALIDATION DE L'AVOIR (DIRECTION FINANCIERE)", color: '#6E2C00' },
                        ] as { title: string; color: string }[]).map(({ title, color }, i) => (
                            <div key={i} style={{
                                border: `3px solid ${BORDER}`,
                                marginBottom: i < 2 ? '8px' : 0,
                                flex: 1, display: 'flex', flexDirection: 'column',
                                background: '#fff',
                                overflow: 'hidden',
                            }}>
                                {/* Bandeau titre coloré (maintenant en noir professionnel) */}
                                <div style={{
                                    background: '#f8f9fa', color: '#000', borderBottom: `2px solid ${BORDER}`,
                                    fontWeight: 800, fontSize: '12px', fontFamily: '"Arial", "Helvetica", sans-serif',
                                    padding: '6px 14px', letterSpacing: '0.5px', textTransform: 'uppercase',
                                }}>
                                    {title}
                                </div>
                                <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', gap: '60px', paddingLeft: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Sq checked={false} />
                                            <span style={{ fontWeight: 500 }}>ACCEPTEE</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Sq checked={false} />
                                            <span style={{ fontWeight: 500 }}>REFUSEE</span>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '6px' }}>Commentaires:</div>
                                    {/* Zone signature ligne pointillée */}
                                    <div style={{ flex: 1, borderBottom: '1px dashed #ccc', minHeight: '20px' }} />
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'flex-end', marginTop: '8px',
                                    }}>
                                        <div style={{ fontSize: '10.5px' }}>DATE DE VALIDATION :</div>
                                        <div style={{
                                            fontSize: '10.5px', fontStyle: 'italic',
                                            borderBottom: '1px solid #aaa', paddingBottom: '2px',
                                            minWidth: '180px', textAlign: 'center',
                                        }}>VISA (Nom, tampon et signature)</div>
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>
            </div>
        </div>
    );
}

