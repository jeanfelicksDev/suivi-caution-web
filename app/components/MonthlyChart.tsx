'use client';

import React, { useEffect, useState } from 'react';

interface MonthlyData {
    labels: string[];
    reçus: number[];
    chèques: number[];
}

interface MonthlyChartProps {
    armateur?: string;
    startDate?: string;
    endDate?: string;
}

const W = 860;
const H = 260;
const PAD = { top: 24, right: 24, bottom: 44, left: 48 };

function toPoints(values: number[], max: number): string {
    if (values.length === 0) return '';
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    return values
        .map((v, i) => {
            const x = PAD.left + (i / (values.length - 1)) * chartW;
            const y = PAD.top + chartH - (max > 0 ? (v / max) * chartH : 0);
            return `${x},${y}`;
        })
        .join(' ');
}

function toAreaPoints(values: number[], max: number): string {
    if (values.length === 0) return '';
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    const pts = values.map((v, i) => {
        const x = PAD.left + (i / (values.length - 1)) * chartW;
        const y = PAD.top + chartH - (max > 0 ? (v / max) * chartH : 0);
        return `${x},${y}`;
    });
    const first = `${PAD.left},${PAD.top + chartH}`;
    const last = `${PAD.left + chartW},${PAD.top + chartH}`;
    return `${first} ${pts.join(' ')} ${last}`;
}

export default function MonthlyChart({ armateur = '', startDate = '', endDate = '' }: MonthlyChartProps) {
    const [data, setData] = useState<MonthlyData | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; recu: number; cheque: number } | null>(null);

    useEffect(() => {
        const params = new URLSearchParams();
        if (armateur) params.append('armateur', armateur);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const url = '/api/dashboard/monthly' + (params.toString() ? `?${params.toString()}` : '');

        setData(null);
        fetch(url)
            .then(r => r.json())
            .then(setData)
            .catch(console.error);
    }, [armateur, startDate, endDate]);

    if (!data) return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
            Chargement du graphique…
        </div>
    );

    const max = Math.max(...(data.reçus || [0]), ...(data.chèques || [0]), 1);
    const gridLines = 5;
    const chartH = H - PAD.top - PAD.bottom;
    const chartW = W - PAD.left - PAD.right;

    return (
        <div style={{ width: '100%', overflowX: 'auto' }}>
            {/* Légende */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                    <svg width="28" height="4"><line x1="0" y1="2" x2="28" y2="2" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="0" /></svg>
                    Dossiers reçus
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                    <svg width="28" height="4"><line x1="0" y1="2" x2="28" y2="2" stroke="#10b981" strokeWidth="2.5" /></svg>
                    Chèques émis
                </span>
            </div>

            <svg
                viewBox={`0 0 ${W} ${H}`}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onMouseLeave={() => setTooltip(null)}
            >
                <defs>
                    <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grille horizontale */}
                {Array.from({ length: gridLines + 1 }).map((_, i) => {
                    const y = PAD.top + (i / gridLines) * chartH;
                    const val = Math.round(max - (i / gridLines) * max);
                    return (
                        <g key={i}>
                            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                                stroke="#e2e8f0" strokeWidth={i === gridLines ? 1.5 : 1} />
                            <text x={PAD.left - 8} y={y + 4} textAnchor="end"
                                fontSize="11" fill="#94a3b8">{val}</text>
                        </g>
                    );
                })}

                {/* Aires */}
                <polygon points={toAreaPoints(data.reçus, max)} fill="url(#gradBlue)" />
                <polygon points={toAreaPoints(data.chèques, max)} fill="url(#gradGreen)" />

                {/* Courbes */}
                <polyline
                    points={toPoints(data.reçus, max)}
                    fill="none" stroke="#3b82f6" strokeWidth="2.5"
                    strokeLinejoin="round" strokeLinecap="round"
                />
                <polyline
                    points={toPoints(data.chèques, max)}
                    fill="none" stroke="#10b981" strokeWidth="2.5"
                    strokeLinejoin="round" strokeLinecap="round"
                />

                {/* Points interactifs */}
                {data.labels.map((label, i) => {
                    const x = PAD.left + (i / (data.labels.length - 1)) * chartW;
                    const yR = PAD.top + chartH - (max > 0 ? (data.reçus[i] / max) * chartH : 0);
                    const yC = PAD.top + chartH - (max > 0 ? (data.chèques[i] / max) * chartH : 0);
                    return (
                        <g key={i}
                            onMouseEnter={() => setTooltip({ x, y: Math.min(yR, yC), label, recu: data.reçus[i], cheque: data.chèques[i] })}
                            style={{ cursor: 'crosshair' }}
                        >
                            {/* Zone hover invisible */}
                            <rect x={x - 18} y={PAD.top} width={36} height={chartH} fill="transparent" />
                            {/* Dot reçus */}
                            <circle cx={x} cy={yR} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                            {/* Dot chèques */}
                            <circle cx={x} cy={yC} r="4" fill="white" stroke="#10b981" strokeWidth="2" />
                            {/* Label mois */}
                            <text x={x} y={H - PAD.bottom + 16} textAnchor="middle"
                                fontSize="11" fill="#64748b">{label}</text>
                        </g>
                    );
                })}

                {/* Tooltip */}
                {tooltip && (() => {
                    const tx = Math.min(Math.max(tooltip.x - 60, 4), W - 130);
                    const ty = Math.max(tooltip.y - 70, 4);
                    return (
                        <g>
                            <rect x={tx} y={ty} width={124} height={64} rx="8"
                                fill="#1e293b" opacity="0.92" />
                            <text x={tx + 62} y={ty + 18} textAnchor="middle"
                                fontSize="12" fontWeight="700" fill="white">{tooltip.label}</text>
                            <circle cx={tx + 14} cy={ty + 34} r="4" fill="#3b82f6" />
                            <text x={tx + 22} y={ty + 38} fontSize="11" fill="#93c5fd">
                                Reçus : <tspan fontWeight="700" fill="white">{tooltip.recu}</tspan>
                            </text>
                            <circle cx={tx + 14} cy={ty + 52} r="4" fill="#10b981" />
                            <text x={tx + 22} y={ty + 56} fontSize="11" fill="#6ee7b7">
                                Chèques : <tspan fontWeight="700" fill="white">{tooltip.cheque}</tspan>
                            </text>
                        </g>
                    );
                })()}
            </svg>
        </div>
    );
}
