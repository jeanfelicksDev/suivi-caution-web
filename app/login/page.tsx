'use client';
import React, { useState } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import { Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [view, setView] = useState<'connexion' | 'inscription' | 'oubli'>('connexion');

    // Formulaire
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Etat loading & erreurs
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const resetForm = () => {
        setUsername('');
        setPassword('');
        setError(null);
        setSuccess(null);
    };

    const handleSwitchView = (newView: 'connexion' | 'inscription' | 'oubli') => {
        setView(newView);
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            if (view === 'inscription') {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                setSuccess('Compte créé avec succès ! Connectez-vous.');
                setTimeout(() => {
                    handleSwitchView('connexion');
                }, 2000);
            }
            else if (view === 'connexion') {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                login(data.user);
            }
            else if (view === 'oubli') {
                // Simulation envoi mail
                await new Promise(r => setTimeout(r, 1000));
                setSuccess('Si cet email existe, un lien de réinitialisation vous a été envoyé.');
            }
        } catch (err: any) {
            setError(err.message || "Une erreur inattendue est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', minHeight: '100vh', background: 'var(--primary-dark)', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 2rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', background: 'white' }}>

                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#e0e7ff', color: 'var(--accent)', marginBottom: '1rem' }}>
                        <ShieldCheck size={32} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                        Gestion Cautions DSM
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {view === 'connexion' ? 'Accédez à votre espace de suivi' : view === 'inscription' ? 'Créez votre compte collaborateur' : 'Restaurez votre accès'}
                    </p>
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', marginBottom: '1.25rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div style={{ padding: '0.75rem', marginBottom: '1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {view === 'inscription' && (
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Nom complet</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '2px solid var(--border)', background: '#f8fafc', fontSize: '0.9rem', outline: 'none' }}
                                placeholder="Jean Dupont"
                            />
                        </div>
                    )}

                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Adresse Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '2px solid var(--border)', background: '#f8fafc', fontSize: '0.9rem', outline: 'none' }}
                            placeholder="jean.dupont@cgmapi.com"
                        />
                    </div>

                    {view !== 'oubli' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>Mot de passe</label>
                                {view === 'connexion' && (
                                    <button type="button" onClick={() => handleSwitchView('oubli')} style={{ background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', cursor: 'pointer' }}>
                                        Oublié ?
                                    </button>
                                )}
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '2px solid var(--border)', background: '#f8fafc', fontSize: '0.9rem', outline: 'none' }}
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ background: 'var(--primary)', color: 'white', fontWeight: 800, padding: '0.85rem', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', boxShadow: '0 4px 0 0 #0f172a' }}
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {view === 'connexion' ? 'Se connecter' : view === 'inscription' ? 'Créer mon compte' : 'Réinitialiser le mot de passe'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {view === 'connexion' && (
                        <>Pas encore de compte ? <button onClick={() => handleSwitchView('inscription')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 800, cursor: 'pointer' }}>S'inscrire</button></>
                    )}
                    {view === 'inscription' && (
                        <>Déjà un compte ? <button onClick={() => handleSwitchView('connexion')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 800, cursor: 'pointer' }}>Se connecter</button></>
                    )}
                    {view === 'oubli' && (
                        <button onClick={() => handleSwitchView('connexion')} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center', margin: '0 auto', background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 800, cursor: 'pointer' }}>
                            <ArrowLeft size={14} /> Retour à la connexion
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
