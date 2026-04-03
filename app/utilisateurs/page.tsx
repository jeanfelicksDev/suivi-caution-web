'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, AlertCircle, Save, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    permissions: string[];
    created_at: string;
}

const SECTIONS = [
    {
        id: 'DASHBOARD',
        label: 'Tableau de Bord',
        color: '#6366f1',
        bg: '#eef2ff',
        single: true,
        cols: [{ id: 'DASHBOARD', sub: 'Accès' }]
    },
    {
        id: 'ATTENTE',
        label: 'Dossiers en Attente',
        color: '#f59e0b',
        bg: '#fffbeb',
        single: true,
        cols: [{ id: 'ATTENTE', sub: 'Accès' }]
    },
    {
        id: 'DOSSIER',
        label: 'Nouveau Dossier & Rech.',
        color: '#3b82f6',
        bg: '#eff6ff',
        single: false,
        cols: [
            { id: 'DOSSIER_READ', sub: 'Lecture' },
            { id: 'DOSSIER_WRITE', sub: 'Écriture' },
        ]
    },
    {
        id: 'CHEQUE',
        label: 'Chèque Émis',
        color: '#10b981',
        bg: '#f0fdf4',
        single: false,
        cols: [
            { id: 'CHEQUE_READ', sub: 'Lecture' },
            { id: 'CHEQUE_WRITE', sub: 'Écriture' },
        ]
    },
    {
        id: 'PARTENAIRE',
        label: 'Partenaire',
        color: '#8b5cf6',
        bg: '#faf5ff',
        single: false,
        cols: [
            { id: 'PARTENAIRE_READ', sub: 'Lecture' },
            { id: 'PARTENAIRE_WRITE', sub: 'Écriture' },
        ]
    },
    {
        id: 'HISTORIQUE',
        label: 'Historique',
        color: '#64748b',
        bg: '#f8fafc',
        single: false,
        cols: [
            { id: 'HISTORIQUE_READ', sub: 'Lecture' },
            { id: 'HISTORIQUE_WRITE', sub: 'Écriture' },
        ]
    },
    {
        id: 'CONSULTATION_CLIENT',
        label: 'Consultation Client',
        color: '#ec4899',
        bg: '#fdf2f8',
        single: true,
        cols: [{ id: 'CONSULTATION_CLIENT', sub: 'Accès' }]
    },
];

export default function UsersPermissionsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [scanPath, setScanPath] = useState('');
    const { user: currentUser } = useAuth();

    useEffect(() => { 
        fetchUsers(); 
        fetch('/api/config', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (data.scanFolderPath) setScanPath(data.scanFolderPath);
            })
            .catch(err => console.error(err));
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/utilisateurs', {
                headers: { 'x-user-id': currentUser?.id.toString() || '' }
            });
            if (res.ok) setUsers(await res.json());
            else setErrorMsg('Impossible de charger les utilisateurs.');
        } catch { setErrorMsg('Erreur réseau.'); }
        finally { setLoading(false); }
    };

    const togglePerm = (userId: number, permId: string) => {
        setUsers(users.map(u => {
            if (u.id !== userId) return u;
            const perms = u.permissions.includes(permId)
                ? u.permissions.filter(p => p !== permId)
                : [...u.permissions, permId];
            return { ...u, permissions: perms };
        }));
    };

    const handleRoleChange = (userId: number, role: string) => {
        setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
    };

    const saveUser = async (user: User) => {
        setSavingId(user.id);
        setSuccessMsg(''); setErrorMsg('');
        try {
            const res = await fetch('/api/utilisateurs', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': currentUser?.id.toString() || ''
                },
                body: JSON.stringify({ id: user.id, role: user.role, permissions: user.permissions })
            });
            if (res.ok) { setSuccessMsg(`✓ Droits mis à jour pour ${user.username}.`); setTimeout(() => setSuccessMsg(''), 4000); }
            else setErrorMsg("Erreur lors de l'enregistrement.");
        } catch { setErrorMsg("Erreur réseau."); }
        finally { setSavingId(null); }
    };

    const deleteUser = async (user: User) => {
        if (deleteConfirmId !== user.id) {
            setDeleteConfirmId(user.id);
            setTimeout(() => setDeleteConfirmId(null), 3000);
            return;
        }
        setDeleteConfirmId(null);
        setDeletingId(user.id);
        try {
            const res = await fetch(`/api/utilisateurs?id=${user.id}`, { 
                method: 'DELETE',
                headers: { 'x-user-id': currentUser?.id.toString() || '' }
            });
            if (res.ok) {
                setSuccessMsg(`Compte supprimé : ${user.username}`);
                setUsers(users.filter(u => u.id !== user.id));
                setTimeout(() => setSuccessMsg(''), 4000);
            } else setErrorMsg("Erreur lors de la suppression.");
        } catch { setErrorMsg("Erreur réseau."); }
        finally { setDeletingId(null); }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '0.75rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> Chargement...
        </div>
    );

    return (
        <div style={{ padding: '2rem', width: '100%', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.9rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '0.4rem' }}>
                        <ShieldCheck size={34} color="var(--accent)" /> Attribution des Droits
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        Configurez les accès de chaque utilisateur par section. Les <strong>Administrateurs</strong> ont un accès total automatique.
                    </p>
                </div>
            </header>

            {/* Section Paramètres Globaux */}
            {currentUser?.role === 'ADMIN' && (
                <section className="card" style={{ marginBottom: '2rem', borderTop: '4px solid #6366f1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ background: '#eef2ff', color: '#6366f1', padding: '0.5rem', borderRadius: '8px' }}>
                            <RefreshCw size={20} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Paramètres Globaux</h2>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                                Chemin des fichiers scannés (ex: file:///C:/MonDossier)
                            </label>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <input 
                                    type="text" 
                                    placeholder="file:///C:/..." 
                                    value={scanPath}
                                    onChange={(e) => setScanPath(e.target.value)}
                                    style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                                <button 
                                    className="btn btn-primary"
                                    onClick={async () => {
                                        if (!scanPath) return;
                                        try {
                                            const res = await fetch('/api/config', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ scanFolderPath: scanPath })
                                            });
                                            if (res.ok) setSuccessMsg('Chemin mis à jour avec succès !');
                                            else setErrorMsg('Erreur lors de la mise à jour.');
                                            setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 3000);
                                        } catch {
                                            setErrorMsg('Erreur réseau.');
                                        }
                                    }}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    <Save size={16} /> Enregistrer le chemin
                                </button>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                                Ce chemin sera utilisé pour le bouton "Fichier scanné" sur la page principale.
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {successMsg && <div style={{ padding: '0.7rem 1rem', marginBottom: '1.25rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} />{successMsg}</div>}
            {errorMsg && <div style={{ padding: '0.7rem 1rem', marginBottom: '1.25rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={16} />{errorMsg}</div>}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }} className="hide-scrollbar">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                            {/* Row 1 – Section headers */}
                            <tr style={{ background: 'var(--primary-dark)' }}>
                                <th rowSpan={2} style={{ padding: '0.75rem 0.6rem', textAlign: 'left', color: 'white', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'middle', minWidth: 150, borderRight: '2px solid rgba(255,255,255,0.12)' }}>
                                    Utilisateur
                                </th>
                                <th rowSpan={2} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: 'white', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'middle', minWidth: 120, borderRight: '2px solid rgba(255,255,255,0.12)' }}>
                                    Rôle
                                </th>
                                {SECTIONS.map(s => (
                                    <th
                                        key={s.id}
                                        colSpan={s.cols.length}
                                        style={{
                                            padding: '0.45rem 0.35rem 0.35rem',
                                            textAlign: 'center',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: '0.63rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.04em',
                                            borderLeft: '2px solid rgba(255,255,255,0.12)',
                                            borderBottom: `3px solid ${s.color}`,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            background: `${s.color}33`, borderRadius: 20,
                                            padding: '2px 6px', fontSize: '0.62rem'
                                        }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
                                            {s.label}
                                        </span>
                                    </th>
                                ))}
                                <th rowSpan={2} style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'white', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', verticalAlign: 'middle', borderLeft: '2px solid rgba(255,255,255,0.12)', minWidth: 100 }}>
                                    Actions
                                </th>
                            </tr>

                            {/* Row 2 – Sub-column labels */}
                            <tr style={{ background: '#1e293b' }}>
                                {SECTIONS.flatMap(s => s.cols.map((col, ci) => (
                                    <th key={col.id} style={{
                                        padding: '0.25rem 0.3rem 0.4rem',
                                        textAlign: 'center',
                                        fontSize: '0.58rem',
                                        fontWeight: 600,
                                        color: ci === 0 ? s.color : '#94a3b8',
                                        borderLeft: ci === 0 ? `2px solid rgba(255,255,255,0.12)` : '1px solid rgba(255,255,255,0.06)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.04em',
                                        minWidth: 50,
                                    }}>
                                        {col.sub}
                                    </th>
                                )))}
                            </tr>
                        </thead>

                        <tbody>
                            {users.map((user, idx) => {
                                const isAdmin = user.role === 'ADMIN';
                                return (
                                    <tr key={user.id} style={{
                                        borderBottom: '1px solid var(--border)',
                                        background: idx % 2 === 0 ? 'white' : '#f8fafc',
                                        transition: 'background 0.15s'
                                    }}>
                                        {/* Utilisateur */}
                                        <td style={{ padding: '0.8rem 1rem', borderRight: '2px solid var(--border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <div style={{
                                                    background: isAdmin ? '#fef3c7' : '#e2e8f0',
                                                    color: isAdmin ? '#92400e' : '#475569',
                                                    borderRadius: '50%', width: 36, height: 36,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                }}>
                                                    <UserCheck size={17} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>{user.username}</div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Rôle */}
                                        <td style={{ padding: '0.8rem 0.75rem', textAlign: 'center', borderRight: '2px solid var(--border)' }}>
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                style={{
                                                    padding: '0.35rem 0.8rem', borderRadius: '20px',
                                                    border: `2px solid ${isAdmin ? '#f59e0b' : '#cbd5e1'}`,
                                                    fontSize: '0.75rem', fontWeight: 700,
                                                    background: isAdmin ? '#fef3c7' : 'white',
                                                    color: isAdmin ? '#92400e' : '#334155',
                                                    cursor: 'pointer', appearance: 'auto',
                                                    minWidth: 120
                                                }}
                                            >
                                                <option value="USER">Utilisateur</option>
                                                <option value="ADMIN">Administrateur</option>
                                            </select>
                                        </td>

                                        {/* Permission checkboxes */}
                                        {SECTIONS.flatMap(s => s.cols.map((col, ci) => {
                                            const checked = user.permissions.includes(col.id) || isAdmin;
                                            return (
                                                <td key={col.id} style={{
                                                    padding: '0.4rem 0.3rem',
                                                    textAlign: 'center',
                                                    borderLeft: ci === 0 ? '2px solid var(--border)' : '1px solid #e2e8f0',
                                                    background: checked && !isAdmin ? `${s.color}09` : 'transparent',
                                                    verticalAlign: 'middle',
                                                    transition: 'background 0.2s'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => !isAdmin && togglePerm(user.id, col.id)}
                                                        disabled={isAdmin}
                                                        style={{
                                                            width: 16, height: 16,
                                                            accentColor: s.color,
                                                            cursor: isAdmin ? 'not-allowed' : 'pointer',
                                                            opacity: isAdmin ? 0.5 : 1,
                                                            display: 'block',
                                                            margin: '0 auto',
                                                        }}
                                                    />
                                                </td>
                                            );
                                        }))}

                                        {/* Actions */}
                                        <td style={{ padding: '0.8rem 0.75rem', textAlign: 'center', borderLeft: '2px solid var(--border)' }}>
                                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => saveUser(user)}
                                                    disabled={savingId === user.id || deletingId === user.id}
                                                    title="Enregistrer"
                                                    style={{ padding: '0.45rem 0.7rem', borderRadius: '8px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center' }}
                                                >
                                                    {savingId === user.id ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(user)}
                                                    disabled={deletingId === user.id}
                                                    title="Supprimer"
                                                    style={{
                                                        padding: '0.45rem 0.7rem', borderRadius: '8px',
                                                        border: '1px solid #fca5a5', cursor: 'pointer',
                                                        fontSize: '0.75rem', fontWeight: 700,
                                                        background: deleteConfirmId === user.id ? '#dc2626' : '#fee2e2',
                                                        color: deleteConfirmId === user.id ? 'white' : '#b91c1c',
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                        transition: 'all 0.2s', whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {deletingId === user.id
                                                        ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                                                        : deleteConfirmId === user.id
                                                            ? '⚠ Confirmer'
                                                            : <Trash2 size={13} />
                                                    }
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {users.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Aucun utilisateur trouvé.
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
