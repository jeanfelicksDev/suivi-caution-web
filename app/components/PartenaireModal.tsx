'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Phone, User, ShieldCheck } from 'lucide-react';

interface Partenaire {
    id_partenaire?: number;
    nom_partenaire: string;
    est_client: number;
    est_transitaire: number;
    num_fne: string | null;
    telephone: string | null;
}

interface PartenaireModalProps {
    isOpen: boolean;
    onClose: () => void;
    partenaireId?: number;
    onSaveSuccess: (p: Partenaire) => void;
}

export default function PartenaireModal({
    isOpen,
    onClose,
    partenaireId,
    onSaveSuccess
}: PartenaireModalProps) {
    const [form, setForm] = useState<Partenaire>({
        nom_partenaire: '',
        est_client: 0,
        est_transitaire: 0,
        num_fne: '',
        telephone: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && partenaireId) {
            fetch(`/api/partenaires/${partenaireId}`)
                .then(res => res.json())
                .then(data => setForm(data))
                .catch(err => console.error(err));
        } else if (isOpen) {
            setForm({
                nom_partenaire: '',
                est_client: 0,
                est_transitaire: 0,
                num_fne: '',
                telephone: '',
            });
        }
    }, [isOpen, partenaireId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.est_client === 0 && form.est_transitaire === 0) {
            setError('Veuillez cocher Client ou Transitaire.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const method = partenaireId ? 'PATCH' : 'POST';
            const url = partenaireId ? `/api/partenaires/${partenaireId}` : '/api/partenaires';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error('Erreur lors de la sauvegarde');
            const saved = await res.json();
            onSaveSuccess(saved);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div style={{
                background: 'white', borderRadius: '1rem', width: '100%', maxWidth: '450px',
                boxShadow: '0 25px 60px -10px rgba(0,0,0,0.3)',
                border: '2px solid var(--accent)',
            }}>
                <div style={{
                    padding: '1.25rem', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    borderRadius: '0.9rem 0.9rem 0 0', color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck size={20} />
                        <h3 style={{ margin: 0, color: 'white' }}>Gérer Partenaire</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    {error && <div style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.8rem' }}>{error}</div>}

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={form.est_client === 1} 
                                onChange={e => setForm({ 
                                    ...form, 
                                    est_client: e.target.checked ? 1 : 0, 
                                    est_transitaire: e.target.checked ? 0 : form.est_transitaire 
                                })} 
                            />
                            Client
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={form.est_transitaire === 1} 
                                onChange={e => setForm({ 
                                    ...form, 
                                    est_transitaire: e.target.checked ? 1 : 0, 
                                    est_client: e.target.checked ? 0 : form.est_client 
                                })} 
                            />
                            Transitaire
                        </label>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                            Nom Partenaire <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input type="text" value={form.nom_partenaire} onChange={e => setForm({ ...form, nom_partenaire: e.target.value.toUpperCase() })}
                                style={{ paddingLeft: '2.5rem', width: '100%' }} placeholder="—" required />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                            Numéro FNE <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input type="text" value={form.num_fne || ''} onChange={e => setForm({ ...form, num_fne: e.target.value.toUpperCase() })}
                            style={{ width: '100%' }} placeholder="Ex: FNE-001" required />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                            Téléphone <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input type="text" value={form.telephone || ''} onChange={e => setForm({ ...form, telephone: e.target.value.toUpperCase() })}
                                style={{ paddingLeft: '2.5rem', width: '100%' }} placeholder="—" required />
                        </div>
                    </div>



                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Annuler</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
                            <Save size={16} />
                            {loading ? 'Soumission...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
