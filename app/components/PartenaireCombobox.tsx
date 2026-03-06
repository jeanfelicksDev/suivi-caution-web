'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, ChevronDown, Check } from 'lucide-react';

interface Partenaire {
    id_partenaire: number;
    nom_partenaire: string;
    num_fne?: string | null;
}

interface PartenaireComboboxProps {
    value: string;
    onChange: (val: string) => void;
    type: 'client' | 'transitaire';
    onManage?: (id?: number) => void;
    placeholder?: string;
    name: string;
    formData: any;
}

export default function PartenaireCombobox({
    value,
    onChange,
    type,
    onManage,
    placeholder = "Sélectionner...",
    name
}: PartenaireComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value || '');
    const [options, setOptions] = useState<Partenaire[]>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialiser la requête quand la valeur change (ex: chargement dossier)
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (open) {
                fetchOptions();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, open]);

    const fetchOptions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/partenaires?type=${type}&query=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setOptions(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (p: Partenaire) => {
        onChange(p.nom_partenaire);
        setQuery(p.nom_partenaire);
        setOpen(false);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                    type="text"
                    name={name}
                    autoComplete="off"
                    value={query}
                    onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setQuery(val);
                        onChange(val);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    style={{ width: '100%', paddingRight: '45px' }}
                />
                <div style={{ position: 'absolute', right: '5px', display: 'flex', gap: '2px', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={() => setOpen(!open)}
                        style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#94a3b8' }}
                    >
                        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {onManage && (
                        <button
                            type="button"
                            onClick={async () => {
                                if (!query) {
                                    onManage(undefined);
                                    return;
                                }
                                const exactMatch = options.find(p => p.nom_partenaire === query);
                                if (exactMatch) {
                                    onManage(exactMatch.id_partenaire);
                                } else {
                                    setLoading(true);
                                    try {
                                        const res = await fetch(`/api/partenaires?type=${type}&query=${encodeURIComponent(query)}`);
                                        if (res.ok) {
                                            const data = await res.json();
                                            const match = data.find((p: Partenaire) => p.nom_partenaire === query);
                                            onManage(match ? match.id_partenaire : undefined);
                                        } else {
                                            onManage(undefined);
                                        }
                                    } catch {
                                        onManage(undefined);
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            }}
                            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--accent)' }}
                            title="Gérer partenaires"
                        >
                            <User size={14} />
                        </button>
                    )}
                </div>
            </div>

            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                    background: 'white', borderRadius: '8px', marginTop: '4px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0', maxHeight: '250px', overflowY: 'auto'
                }}>
                    {loading && <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: '#94a3b8' }}>Recherche...</div>}
                    {!loading && options.length === 0 && (
                        <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: '#94a3b8' }}>Aucun résultat</div>
                    )}
                    {options.map((p) => (
                        <div
                            key={p.id_partenaire}
                            onClick={() => handleSelect(p)}
                            style={{
                                padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: query === p.nom_partenaire ? '#f1f5f9' : 'transparent',
                                borderBottom: '1px solid #f1f5f9'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = query === p.nom_partenaire ? '#f1f5f9' : 'transparent'}
                        >
                            <div>
                                <div style={{ fontWeight: 600 }}>{p.nom_partenaire}</div>
                                {p.num_fne && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>FNE: {p.num_fne}</div>}
                            </div>
                            {query === p.nom_partenaire && <Check size={14} color="#10b981" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
