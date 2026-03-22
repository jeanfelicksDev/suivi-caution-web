'use client';

import React, { useState } from 'react';
import { LayoutDashboard, TrendingUp, Users, Clock, ArrowUpRight, ArrowDownRight, RotateCcw } from 'lucide-react';
import ArmateurSelect from '@/app/components/ArmateurSelect';

interface StatsData {
    avgGlobal: number;
    avgAgent: number;
    stepAverages: number[];
    statsCards: {
        totalDossiers: number;
        actifs: number;
        clientsUniques: number;
        tauxRetour: number;
    };
}

export default function Dashboard() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [armateur, setArmateur] = useState('');

    const fetchStats = React.useCallback(async () => {
        let url = '/api/dashboard/stats';
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (armateur) params.append('armateur', armateur);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            setStats(data);
        }
    }, [startDate, endDate, armateur]);

    React.useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stepNames = [
        "Traitement réception",
        "Traitement armateur",
        "Sce détention",
        "Mise en litige",
        "Traitement des avoirs",
        "Mise au recouvrement",
        "1ère signature",
        "2ème signature",
        "Pièce de caisse",
        "Comptabilité"
    ];

    const formatPartDate = (d: string) => {
        if (!d) return '';
        const t = d.split('-');
        return `${t[2]}/${t[1]}/${t[0]}`;
    };

    let periodText = 'ce mois';
    if (startDate && endDate) periodText = `du ${formatPartDate(startDate)} au ${formatPartDate(endDate)}`;
    else if (startDate) periodText = `depuis le ${formatPartDate(startDate)}`;
    else if (endDate) periodText = `jusqu'au ${formatPartDate(endDate)}`;

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary)', margin: 0, fontWeight: 800 }}>Tableau de Bord</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Aperçu global de l&apos;activité des cautions</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.3rem' }}>Armateur :</label>
                        <ArmateurSelect
                            value={armateur}
                            onChange={(val) => setArmateur(val)}
                            hideAdd={true}
                            style={{ background: 'white', padding: '0.5rem', width: '160px', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 600 }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.3rem' }}>Période De Réception Du :</label>
                        <input type={startDate ? "date" : "text"} className="input" 
                            style={{ background: 'white', padding: '0.5rem', width: '160px', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                            onFocus={(e) => (e.target.type = "date")}
                            onBlur={(e) => !startDate && (e.target.type = "text")}
                            placeholder="JJ/MM/AAAA"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.3rem' }}>Au :</label>
                        <input type={endDate ? "date" : "text"} className="input" 
                            style={{ background: 'white', padding: '0.5rem', width: '160px', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                            onFocus={(e) => (e.target.type = "date")}
                            onBlur={(e) => !endDate && (e.target.type = "text")}
                            placeholder="JJ/MM/AAAA"
                        />
                    </div>
                    <button className="btn btn-primary" onClick={fetchStats} style={{ background: '#334155', color: 'white', fontWeight: 700, letterSpacing: '0.05em', padding: '0.5rem 1.25rem', borderRadius: '8px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        FILTRER
                    </button>
                    <button type="button" onClick={() => window.location.reload()} title="Actualiser la page" className="btn-refresh">
                        <RotateCcw size={18} />
                    </button>
                </div>
            </header>

            <div className="stat-grid" style={{ marginBottom: '2.5rem' }}>
                <StatCard label="Nbre de Dossiers Reçus" value={stats?.statsCards?.totalDossiers ?? "..."} period={periodText} trend="" trendUp={true} icon={<LayoutDashboard color="var(--accent)" />} valueColor="#4f46e5" />
                <StatCard label="Dossiers en traitement" value={stats?.statsCards?.actifs ?? "..."} period={periodText} trend="" trendUp={false} icon={<Clock color="#f59e0b" />} valueColor="#f97316" />
                <StatCard label="Clients/Transitaires" value={stats?.statsCards?.clientsUniques ?? "..."} period={periodText} trend="" trendUp={true} icon={<Users color="#3b82f6" />} valueColor="#3b82f6" />
                <StatCard label="Dossiers reçus et traités" value={(stats?.statsCards?.tauxRetour ?? "...") + "%"} period={periodText} trend="" trendUp={true} icon={<TrendingUp color="#10b981" />} valueColor="#ec4899" />
            </div>

            {/*  Section Durées Moyennes */}
            {stats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    <div className="grid grid-cols-2">
                        <div className="card" style={{ borderLeft: '4px solid var(--accent)', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                <div style={{ background: '#f0f9ff', padding: '0.75rem', borderRadius: '50%' }}>
                                    <Clock size={28} color="var(--accent)" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-muted)' }}>Nbre de jour Calendaire pour traiter un dossier</h3>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Date de Réception → Date de Chèque (7j/7)</p>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.1rem 0 0 0' }}>Le temps d'attente du client avant de recevoir son chèque (jour fériés et week-end inclus)</p>
                                </div>
                            </div>
                            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#8b5cf6', lineHeight: 1 }}>
                                {stats.avgGlobal} <span style={{ fontSize: '1.25rem', color: '#64748b', fontWeight: 600 }}>Jours</span>
                            </div>
                        </div>

                        <div className="card" style={{ borderLeft: '4px solid #10b981', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '50%' }}>
                                    <TrendingUp size={28} color="#10b981" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-muted)' }}>Nbre de jour Ouvrable pour traiter un dossier</h3>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Réception → Compta (Hors Fériés, WE, Suspendus...)</p>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.1rem 0 0 0' }}>sans week-end, jour férié, ...</p>
                                </div>
                            </div>
                            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#0ea5e9', lineHeight: 1 }}>
                                {stats.avgAgent} <span style={{ fontSize: '1.25rem', color: '#64748b', fontWeight: 600 }}>Jours</span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                            <Clock size={16} style={{ display: 'inline', marginRight: '0.5rem', transform: 'translateY(-2px)' }} />
                            Temps moyen de traitement mis lors des étapes ci-dessous :
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                            {stats.stepAverages.map((avg: number, index: number) => (
                                <div key={index} style={{
                                    background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 'var(--radius)',
                                    border: '1px solid var(--border)', flex: '1 1 calc(33.333% - 1rem)', minWidth: '240px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                                        <span style={{ color: 'var(--accent)', marginRight: '0.4rem' }}>{index + 1}.</span>
                                        {stepNames[index]}
                                    </div>
                                    <div style={{ background: avg > 5 ? '#fee2e2' : '#f0fdf4', color: avg > 5 ? '#ef4444' : '#16a34a', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>
                                        {avg} j
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, trend, trendUp, icon, period, valueColor }: { label: string, value: string | number, trend: string, trendUp: boolean, icon: React.ReactNode, period: string, valueColor?: string }) {
    return (
        <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div className="stat-label">{label}</div>
                <div>{icon}</div>
            </div>
            <div className="stat-value" style={{ color: valueColor }}>{value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.875rem', color: trendUp ? '#10b981' : '#ef4444' }}>
                {trend && (
                    <>
                        {trendUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {trend}
                    </>
                )}
                <span style={{ color: 'var(--text-muted)', marginLeft: trend ? '0.25rem' : '0' }}>{period}</span>
            </div>
        </div>
    );
}
