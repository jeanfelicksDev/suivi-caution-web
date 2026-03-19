'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, LayoutDashboard, Database, LogOut, FileText, CreditCard, ShieldCheck, Eye } from 'lucide-react';
import { useAuth } from './AuthProvider';
import AttenteTiroir from './AttenteTiroir';

const Sidebar = () => {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    if (!user) return null;

    const isAdmin = user.role === 'ADMIN';
    const perms = user.permissions || [];

    const canRead = isAdmin || perms.includes('READ_ONLY');
    const canManageCheques = isAdmin || perms.includes('IMPORT_CHEQUES');

    const menuItems = [
        { name: 'Tableau de Bord', icon: <LayoutDashboard size={20} />, path: '/dashboard', show: canRead },
        { name: 'Nouveau Dossier & Rech.', icon: <Search size={20} />, path: '/', show: true },
        { name: 'Consultation Client', icon: <Eye size={20} />, path: '/consultation', show: true },
        { name: 'Historique', icon: <Database size={20} />, path: '/historique', show: canRead },

        { name: 'Partenaires', icon: <ShieldCheck size={20} />, path: '/partenaires', show: true },
        { name: 'Chèques Émis', icon: <CreditCard size={20} />, path: '/cheques', show: canManageCheques },
    ];


    return (
        <aside className="sidebar">
            <div className="sidebar-logo" style={{ fontSize: '1.4rem', lineHeight: '1.2', padding: '0.5rem 0.25rem 2rem 0.25rem', textAlign: 'left' }}>
                Gestion des cautions
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.5rem' }}>
                    {user.username} <span style={{ opacity: 0.5 }}>({user.role})</span>
                </div>
            </div>

            <nav style={{ flex: 1 }}>
                {menuItems.filter(i => i.show).map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`nav-item ${pathname === item.path ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </Link>
                ))}

                {/* Tiroir En Attente */}
                {canRead && (
                    <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem' }}>
                        <AttenteTiroir />
                    </div>
                )}
            </nav>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                {isAdmin && (
                    <>
                        <Link href="/utilisateurs" className={`nav-item ${pathname === '/utilisateurs' ? 'active' : ''}`}>
                            <ShieldCheck size={20} />
                            <span>Droits d&apos;Accès</span>
                        </Link>
                    </>
                )}
                <button onClick={logout} className="nav-item" style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer' }}>
                    <LogOut size={20} />
                    <span>Déconnexion</span>
                </button>
            </div>
        </aside >
    );
};

export default Sidebar;
