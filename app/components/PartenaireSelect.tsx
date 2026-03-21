'use client';

import React, { useState, useEffect } from 'react';

interface Partenaire {
    id_partenaire: number;
    nom_partenaire: string;
}

interface PartenaireSelectProps {
    value: string;
    onChange: (val: string) => void;
    type: 'client' | 'transitaire';
    name?: string;
    placeholder?: string;
}

export default function PartenaireSelect({
    value,
    onChange,
    type,
    name,
    placeholder = "Sélectionner..."
}: PartenaireSelectProps) {
    const [options, setOptions] = useState<Partenaire[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                // Requête vide ramène toute la liste (selon l'API existante)
                const res = await fetch(`/api/partenaires?type=${type}&query=`);
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
        fetchAll();
    }, [type]);

    return (
        <select
            name={name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={{ 
                width: '100%', 
                padding: '0.6rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'white',
                color: 'var(--text)',
                fontWeight: value ? 700 : 400
            }}
            disabled={loading}
        >
            <option value="">{loading ? 'Chargement...' : placeholder}</option>
            {options.map((p) => (
                <option key={p.id_partenaire} value={p.nom_partenaire}>
                    {p.nom_partenaire}
                </option>
            ))}
        </select>
    );
}
