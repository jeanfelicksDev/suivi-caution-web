'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, ShieldCheck, User, Building } from 'lucide-react';
import PartenaireModal from '../components/PartenaireModal';

interface Partenaire {
    id_partenaire: number;
    nom_partenaire: string;
    est_client: number;
    est_transitaire: number;
    num_fne: string | null;
    telephone: string | null;
}

export default function PartenairesPage() {
    const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'client', 'transitaire'

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | undefined>(undefined);

    const loadPartenaires = async () => {
        setLoading(true);
        try {
            const url = `/api/partenaires?query=${encodeURIComponent(searchQuery)}${filterType !== 'all' ? `&type=${filterType}` : ''}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setPartenaires(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadPartenaires();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, filterType]);

    const handleCreate = () => {
        setSelectedId(undefined);
        setModalOpen(true);
    };

    const handleEdit = (id: number) => {
        setSelectedId(id);
        setModalOpen(true);
    };

    const handleModalSuccess = () => {
        loadPartenaires();
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>
                        <ShieldCheck size={28} color="var(--accent)" />
                        Gestion des Partenaires
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Gérez la liste de vos clients et transitaires</p>
                </div>
                <button onClick={handleCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} />
                    Nouveau Partenaire
                </button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', background: 'white' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{ width: '200px' }}
                >
                    <option value="all">Tous les types</option>
                    <option value="client">Clients uniquement</option>
                    <option value="transitaire">Transitaires uniquement</option>
                </select>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Nom Partenaire</th>
                                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Type</th>
                                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Numéro FNE</th>
                                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Contact</th>
                                <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Chargement...</td>
                                </tr>
                            ) : partenaires.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Aucun partenaire trouvé.</td>
                                </tr>
                            ) : (
                                partenaires.map((p) => (
                                    <tr key={p.id_partenaire} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{p.nom_partenaire}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                {p.est_client === 1 && (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem', background: '#ecfdf5', color: '#059669', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                                                        <User size={12} /> Client
                                                    </span>
                                                )}
                                                {p.est_transitaire === 1 && (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem', background: '#eff6ff', color: '#2563eb', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                                                        <Building size={12} /> Transitaire
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#64748b' }}>{p.num_fne || '—'}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                                            {p.telephone ? <div>📞 {p.telephone}</div> : '—'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleEdit(p.id_partenaire)}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.4rem', display: 'inline-flex' }}
                                                title="Modifier"
                                            >
                                                <Edit2 size={16} color="var(--accent)" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <PartenaireModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                partenaireId={selectedId}
                onSaveSuccess={handleModalSuccess}
            />
        </div>
    );
}
