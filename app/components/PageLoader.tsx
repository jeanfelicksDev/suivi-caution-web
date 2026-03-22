'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function PageLoader() {
    const pathname = usePathname();
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const prevPathname = useRef(pathname);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (prevPathname.current !== pathname) {
            // Nouvelle route détectée -> fin du chargement
            setProgress(100);
            setTimeout(() => {
                setVisible(false);
                setProgress(0);
            }, 400);
            prevPathname.current = pathname;
        }
    }, [pathname]);

    // Démarrer la barre quand on clique sur un lien
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a');
            if (!target) return;
            const href = target.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;

            // Lancement de la barre de progression
            setVisible(true);
            setProgress(10);

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 85) {
                        clearInterval(timerRef.current!);
                        return 85;
                    }
                    return prev + Math.random() * 12;
                });
            }, 200);
        };

        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            zIndex: 99999,
            background: 'rgba(79, 70, 229, 0.1)',
        }}>
            <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #a78bfa)',
                transition: progress === 100 ? 'width 0.2s ease-out' : 'width 0.3s ease',
                boxShadow: '0 0 12px rgba(124, 58, 237, 0.8)',
                borderRadius: '0 2px 2px 0',
            }} />
        </div>
    );
}
