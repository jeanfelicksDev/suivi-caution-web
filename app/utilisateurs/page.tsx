'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, AlertCircle, Save, CheckCircle2, RefreshCw } from 'lucide-react';

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    permissions: string[];
    created_at: string;
}

const PERMISSIONS = [
    { id: 'READ_ONLY', label: 'Lecture (Dashboards, Historique)', color: 'text-slate-600' },
    { id: 'CREATE_DOSSIER', label: 'Création & Édition de Dossier', color: 'text-blue-600' },
    { id: 'VALIDATION_COMPTA', label: 'Validation Compta & Clôture', color: 'text-amber-600' },
    { id: 'IMPORT_CHEQUES', label: 'Gestion & Import Chèques', color: 'text-emerald-600' }
];

export default function UsersPermissionsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/utilisateurs');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                setErrorMsg('Impossible de charger les utilisateurs.');
            }
        } catch {
            setErrorMsg('Erreur réseau lors du chargement des utilisateurs.');
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionChange = (userId: number, permId: string, isChecked: boolean) => {
        setUsers(users.map(u => {
            if (u.id === userId) {
                let updatedPerms = [...u.permissions];
                if (isChecked) {
                    if (!updatedPerms.includes(permId)) updatedPerms.push(permId);
                } else {
                    updatedPerms = updatedPerms.filter(p => p !== permId);
                }
                return { ...u, permissions: updatedPerms };
            }
            return u;
        }));
    };

    const handleRoleChange = (userId: number, role: string) => {
        setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
    };

    const saveUser = async (user: User) => {
        setSavingId(user.id);
        setSuccessMsg('');
        setErrorMsg('');
        try {
            const res = await fetch('/api/utilisateurs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, role: user.role, permissions: user.permissions })
            });

            if (res.ok) {
                setSuccessMsg(`Droits mis à jour pour ${user.username}.`);
                setTimeout(() => setSuccessMsg(''), 4000);
            } else {
                setErrorMsg("Erreur lors de l'enregistrement.");
            }
        } catch {
            setErrorMsg("Erreur réseau pendant l'enregistrement.");
        } finally {
            setSavingId(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
                <RefreshCw className="animate-spin mr-3" /> Chargement des comptes...
            </div>
        );
    }

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '0.5rem' }}>
                    <ShieldCheck size={36} color="var(--accent)" />
                    Attribution des Droits
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px' }}>
                    Gérez ci-dessous les permissions accordées à chaque utilisateur. Les comptes <strong>Administrateurs</strong> ont un accès total quel que soit le niveau de permissions cochées.
                </p>
            </header>

            {successMsg && (
                <div style={{ padding: '0.75rem 1.2rem', marginBottom: '1.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    <CheckCircle2 size={18} /> {successMsg}
                </div>
            )}

            {errorMsg && (
                <div style={{ padding: '0.75rem 1.2rem', marginBottom: '1.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    <AlertCircle size={18} /> {errorMsg}
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="hide-scrollbar" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead style={{ background: 'var(--primary-dark)', color: 'white', borderBottom: '2px solid var(--accent)' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utilisateur</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>Rôle</th>
                                {PERMISSIONS.map(p => (
                                    <th key={p.id} style={{ padding: '0.8rem 0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', lineHeight: 1.2, borderLeft: '1px solid rgba(255,255,255,0.1)', maxWidth: '120px' }}>
                                        {p.label}
                                    </th>
                                ))}
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'white' : 'var(--primary-light)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ background: '#e2e8f0', color: '#475569', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <UserCheck size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>{user.username}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: user.role === 'ADMIN' ? '#fef3c7' : 'white', color: user.role === 'ADMIN' ? '#92400e' : '#334155' }}
                                        >
                                            <option value="USER">Utilisateur</option>
                                            <option value="ADMIN">Administrateur</option>
                                        </select>
                                    </td>

                                    {PERMISSIONS.map(p => (
                                        <td key={p.id} style={{ padding: '1rem', textAlign: 'center', borderLeft: '1px solid var(--border)', verticalAlign: 'middle' }}>
                                            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: user.role === 'ADMIN' ? 'not-allowed' : 'pointer', opacity: user.role === 'ADMIN' ? 0.4 : 1 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={user.permissions.includes(p.id) || user.role === 'ADMIN'}
                                                    onChange={(e) => handlePermissionChange(user.id, p.id, e.target.checked)}
                                                    disabled={user.role === 'ADMIN'}
                                                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'inherit' }}
                                                />
                                            </label>
                                        </td>
                                    ))}

                                    <td style={{ padding: '1rem', textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => saveUser(user)}
                                            disabled={savingId === user.id}
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px' }}
                                        >
                                            {savingId === user.id ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                            {savingId === user.id ? '...' : 'Enregistrer'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {users.length === 0 && !loading && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <p>Aucun utilisateur trouvé.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
