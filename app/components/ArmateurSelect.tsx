'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface ArmateurSelectProps {
    value: string;
    onChange: (value: string) => void;
    name?: string;
    style?: React.CSSProperties;
    hideAdd?: boolean;
}

export default function ArmateurSelect({ value, onChange, name = 'armateur', style, hideAdd = false }: ArmateurSelectProps) {
    const [armateurs, setArmateurs] = useState<{ id: number; nom: string }[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newNom, setNewNom] = useState('');
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState('');

    const fetchArmateurs = async () => {
        try {
            const res = await fetch('/api/armateurs');
            if (res.ok) {
                const data = await res.json();
                setArmateurs(data);
            }
        } catch (e) {
            console.error('Erreur chargement armateurs:', e);
        }
    };

    useEffect(() => {
        fetchArmateurs();
    }, []);

    const handleAdd = async () => {
        if (!newNom.trim()) return;
        setAdding(true);
        setError('');
        try {
            const res = await fetch('/api/armateurs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nom: newNom }),
            });
            if (res.status === 409) {
                setError('Cet armateur existe déjà');
                return;
            }
            if (!res.ok) throw new Error();
            const created = await res.json();
            await fetchArmateurs();
            onChange(created.nom);
            setNewNom('');
            setShowAdd(false);
        } catch {
            setError('Erreur lors de l\'ajout');
        } finally {
            setAdding(false);
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'stretch', width: '100%' }}>
                <select
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ flex: 1, minWidth: 0, ...style }} // minWidth: 0 is key for flex children
                >
                    <option value="">—</option>
                    {armateurs.map((a) => (
                        <option key={a.id} value={a.nom}>{a.nom}</option>
                    ))}
                </select>
                {!hideAdd && (
                    <button
                        type="button"
                        onClick={() => setShowAdd(!showAdd)}
                        title="Ajouter un armateur"
                        style={{
                            background: showAdd ? '#64748b' : 'var(--gradient-primary, linear-gradient(135deg, #4f46e5, #7c3aed))',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            width: 38,
                            height: 'auto', // Match select height
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                    >
                        <Plus size={20} />
                    </button>
                )}
            </div>

            {!hideAdd && showAdd && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    marginTop: '0.4rem', padding: '0.75rem',
                    background: 'white', borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    border: '1px solid #e2e8f0', zIndex: 50,
                }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <input
                            type="text"
                            value={newNom}
                            onChange={(e) => setNewNom(e.target.value.toUpperCase())}
                            placeholder="Nom du nouvel armateur"
                            style={{ flex: 1, fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={adding}
                            style={{
                                background: '#10b981', color: 'white', border: 'none',
                                borderRadius: '6px', padding: '0.4rem 0.75rem',
                                fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {adding ? '...' : 'Ajouter'}
                        </button>
                    </div>
                    {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.3rem 0 0 0' }}>{error}</p>}
                </div>
            )}
        </div>
    );
}
