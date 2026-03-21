'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Printer, Loader2, AlertCircle } from 'lucide-react';

interface GroupedData {
    name: string;
    bls: string[];
}

interface ReportData {
    from: string;
    to: string;
    grouped: GroupedData[];
}

interface Props {
    from: string;
    to: string;
    type?: 'reception' | 'sig1' | 'sig2';
    onClose: () => void;
}

function fmtDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    } catch { return dateStr; }
}

export default function TransmissionReport({ from, to, type, onClose }: Props) {
    const printRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/reports/transmission?from=${from}&to=${to}&type=${type || 'reception'}`);
                if (!res.ok) throw new Error('Erreur lors du chargement des données');
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [from, to, type]);

    const handlePrint = () => {
        const content = printRef.current?.innerHTML || '';
        const win = window.open('', '_blank', 'width=900,height=1000');
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Transmission à la ligne - ${fmtDate(from)} au ${fmtDate(to)}</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #000; background: white; padding: 15mm; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1.5px solid #000; padding: 8px 12px; text-align: left; vertical-align: top; height: 5cm; }
                    th { background: #f0f0f0; font-weight: 700; text-transform: uppercase; height: auto; }
                    .header-box { border: 2px solid #000; padding: 10px; text-align: center; font-weight: 800; font-size: 16px; margin-bottom: 5px; }
                    .info-line { margin-bottom: 20px; font-weight: 700; }
                    @media print { body { padding: 0; } @page { margin: 10mm; } }
                </style>
            </head>
            <body onload="window.print();window.close()">
                ${content}
            </body>
            </html>
        `);
        win.document.close();
    };

    if (loading) {
        return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <Loader2 className="animate-spin" size={32} color="var(--accent)" />
                    <span style={{ fontWeight: 600 }}>Génération de l'état...</span>
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

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)',
            zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white', borderRadius: '1rem', width: '100%', maxWidth: '850px',
                maxHeight: '94vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', borderBottom: '1px solid #e2e8f0',
                    background: '#f8fafc',
                }}>
                    <div>
                        <span style={{ fontWeight: 800, color: '#1e293b', display: 'block' }}>
                            Aperçu avant impression
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Période du {fmtDate(from)} au {fmtDate(to)}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Printer size={18} /> Imprimer
                        </button>
                        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Print Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: '#f1f5f9' }}>
                    <div ref={printRef} style={{ background: 'white', padding: '15mm', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', minHeight: '297mm', margin: '0 auto', maxWidth: '210mm' }}>
                        
                        <div style={{ border: '2px solid #000', padding: '10px', textAlign: 'center', fontWeight: 800, fontSize: '18px', marginBottom: '10px', textTransform: 'uppercase' }}>
                            {type === 'sig1' ? 'BORDEREAU DE TRANSMISSION 1ère SIGNATURE' : 
                             type === 'sig2' ? 'BORDEREAU DE TRANSMISSION 2ème SIGNATURE' : 
                             'BORDEREAU DE TRANSMISSION A LA LIGNE'}
                        </div>

                        <div style={{ marginBottom: '20px', fontWeight: 700, fontSize: '14px' }}>
                            Date de réception : DU {fmtDate(from)} AU {fmtDate(to)}
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ border: '1.5px solid #000', padding: '10px', textAlign: 'center', width: '25%' }}>ARMATEUR</th>
                                    <th style={{ border: '1.5px solid #000', padding: '10px', textAlign: 'center', width: '45%' }}>BLS</th>
                                    <th style={{ border: '1.5px solid #000', padding: '10px', textAlign: 'center', width: '30%' }}>SIGNATURE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.grouped.map((group, idx) => (
                                    <tr key={idx} style={{ height: '5cm' }}>
                                        <td style={{ border: '1.5px solid #000', padding: '12px', fontWeight: 700, textAlign: 'center', verticalAlign: 'middle', height: '5cm' }}>
                                            {group.name}
                                        </td>
                                        <td style={{ border: '1.5px solid #000', padding: '12px', height: '5cm' }}>
                                            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                                {group.bls.map((bl, bIdx) => (
                                                    <li key={bIdx} style={{ marginBottom: '4px' }}>* {bl}</li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td style={{ border: '1.5px solid #000', padding: '12px', height: '5cm' }}></td>
                                    </tr>
                                ))}
                                {(!data || data.grouped.length === 0) && (
                                    <tr>
                                        <td colSpan={3} style={{ border: '1.5px solid #000', padding: '20px', textAlign: 'center', color: '#64748b' }}>
                                            Aucun dossier trouvé pour cette période.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
