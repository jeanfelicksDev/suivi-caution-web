'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, Printer, Loader2, AlertCircle, FileText } from 'lucide-react';

interface Dossier {
    date_transmission_compta: string | null;
    num_facture_caution: string | null;
    montant_final: number | null;
    transitaire_nom: string | null;
    mandataire_nom: string | null;
}

interface ReportData {
    from: string;
    to: string;
    dossiers: Dossier[];
}

interface Props {
    from: string;
    to: string;
    onClose: () => void;
}

function fmtDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    } catch { return dateStr; }
}

function fmtCurrency(v: number | null) {
    if (v == null) return '—';
    return v.toLocaleString('fr-FR').replace(/\s/g, ' ');
}

export default function ComptaReport({ from, to, onClose }: Props) {
    const printRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Calcul du total des montants
    const totalMontant = useMemo(() => {
        if (!data) return 0;
        return data.dossiers.reduce((acc, d) => acc + (d.montant_final || 0), 0);
    }, [data]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/reports/compta?from=${from}&to=${to}`);
                if (!res.ok) {
                    const errPayload = await res.json().catch(() => null);
                    throw new Error(errPayload?.error || 'Erreur lors du chargement des données');
                }
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [from, to]);

    const handlePrint = () => {
        const content = printRef.current?.innerHTML || '';
        const win = window.open('', '_blank', 'width=1100,height=1000');
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>BORDEREAU DE TRANSMISSION COMPTA - ${fmtDate(from)}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
                    
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { 
                        font-family: 'Outfit', sans-serif; 
                        font-size: 11px; 
                        color: #000; 
                        background: white; 
                        padding: 15mm; 
                        line-height: 1.4;
                    }
                    
                    .print-area { width: 100%; border: none !important; box-shadow: none !important; padding: 0 !important; }

                    .header-container {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 25px;
                        border-bottom: 1.5px solid #000;
                        padding-bottom: 8px;
                    }
                    
                    .report-title-box {
                        text-align: center;
                        margin: 20px 0 25px 0;
                    }
                    
                    .report-title {
                        font-size: 16px;
                        font-weight: 800;
                        text-transform: uppercase;
                        margin-bottom: 4px;
                        color: #000;
                        letter-spacing: 0.05em;
                    }
                    
                    .report-period {
                        font-size: 11px;
                        font-weight: 600;
                        color: #334155;
                    }
                    
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 5px;
                        border: 1px solid #000;
                    }
                    
                    th, td { 
                        border: 1px solid #000; 
                        padding: 8px 10px; 
                        text-align: left; 
                    }
                    
                    th { 
                        background: #f1f5f9; 
                        font-weight: 700; 
                        text-transform: uppercase;
                        font-size: 10px;
                        color: #000;
                    }
                    
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: 700; }
                    
                    
                    
                    .footer-note { 
                        margin-top: 30px; 
                        font-size: 9px; 
                        color: #64748b; 
                        display: flex;
                        justify-content: space-between;
                        border-top: 0.5px solid #000;
                        padding-top: 6px;
                    }
                    
                    @media print { 
                        body { padding: 0; } 
                        @page { margin: 15mm; size: A4; }
                        tr { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body onload="window.print();window.close()">
                <div class="print-area">
                    ${content}
                </div>
            </body>
            </html>
        `);
        win.document.close();
    };

    if (loading) {
        return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <Loader2 className="animate-spin" size={32} color="#f97316" />
                    <span style={{ fontWeight: 600 }}>Génération en cours...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', maxWidth: '400px', textAlign: 'center' }}>
                    <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>Erreur</h3>
                    <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
                    <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>Fermer</button>
                </div>
            </div>
        );
    }

    const tableCellStyle: React.CSSProperties = {
        border: '1px solid #000',
        padding: '8px 10px',
        textAlign: 'left'
    };

    const headerCellStyle: React.CSSProperties = {
        ...tableCellStyle,
        background: '#f1f5f9',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: '10px'
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)',
            zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem', backdropFilter: 'blur(10px)'
        }}>
            <div style={{
                background: 'white', borderRadius: '1.25rem', width: '100%', maxWidth: '1000px',
                maxHeight: '94vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden'
            }}>
                {/* Header Modal - UI logic */}
                <div style={{
                    padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', borderBottom: '1px solid #e2e8f0',
                    background: '#ffffff',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: '#fff7ed', padding: '0.5rem', borderRadius: '0.5rem' }}>
                            <FileText size={20} color="#f97316" />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                            Aperçu du Rapport
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f97316', border: 'none' }}>
                            <Printer size={18} /> Imprimer ZIP (PDF)
                        </button>
                        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Print Content Area Preview */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: '#f8fafc' }}>
                    <div 
                        ref={printRef} 
                        style={{ 
                            background: 'white', padding: '15mm', 
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
                            minHeight: '290mm', margin: '0 auto', maxWidth: '210mm',
                            color: '#000', fontSize: '11px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        }}
                    >
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1.5px solid #000', paddingBottom: '8px', marginBottom: '20px' }}>
                            <div style={{ fontWeight: 800, fontSize: '14px' }}>AGL / Direction des Solutions Maritimes</div>
                            <div style={{ textAlign: 'right', fontSize: '10px' }}>
                                <strong>Date d'édition :</strong> {new Date().toLocaleDateString('fr-FR')}
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', margin: '20px 0' }}>
                            <div style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                                BORDEREAU DE TRANSMISSION A LA COMPTABILITE
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 600 }}>PERIODE DU {fmtDate(from)} AU {fmtDate(to)}</div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...headerCellStyle, width: '15%', textAlign: 'center' }}>Date Trans.</th>
                                    <th style={{ ...headerCellStyle, width: '20%' }}>Référence Facture</th>
                                    <th style={{ ...headerCellStyle, width: '20%', textAlign: 'right' }}>Montant (FCFA)</th>
                                    <th style={{ ...headerCellStyle, width: '25%' }}>Transitaire</th>
                                    <th style={{ ...headerCellStyle, width: '20%' }}>MANDATAIRE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.dossiers.map((d, idx) => (
                                    <tr key={idx}>
                                        <td style={{ ...tableCellStyle, textAlign: 'center' }}>{fmtDate(d.date_transmission_compta || '')}</td>
                                        <td style={{ ...tableCellStyle, fontWeight: 700 }}>{d.num_facture_caution || ''}</td>
                                        <td style={{ ...tableCellStyle, textAlign: 'right', fontWeight: 700 }}>{fmtCurrency(d.montant_final)}</td>
                                        <td style={tableCellStyle}>{d.transitaire_nom || ''}</td>
                                        <td style={tableCellStyle}>{d.mandataire_nom || ''}</td>
                                    </tr>
                                ))}
                                {(!data || data.dossiers.length === 0) && (
                                    <tr>
                                        <td colSpan={5} style={{ ...tableCellStyle, padding: '30px', textAlign: 'center', color: '#64748b' }}>
                                            Aucun dossier trouvé pour cette période.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>


                        <div style={{ marginTop: '30px', fontSize: '9px', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '0.5px solid #000', paddingTop: '6px' }}>
                            <div>Source : Logiciel Suivi-Caution Web v2.0</div>
                            <div>Suivi-Caution-Web 2.0 Dévéloppé par Jean-Félix ZIAGOUE de AGL/DSM</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
