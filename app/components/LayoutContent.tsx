'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import FieldHighlighter from '@/app/components/FieldHighlighter';
import PageLoader from '@/app/components/PageLoader';

const PUBLIC_ROUTES = ['/consultation'];

export default function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPublicRoute = PUBLIC_ROUTES.some(r => pathname.startsWith(r));

    if (isPublicRoute) {
        return <>{children}</>;
    }

    return (
        <div className="layout-wrapper">
            <PageLoader />
            <Sidebar />
            <main className="main-content">
                {children}
                <FieldHighlighter />
            </main>
        </div>
    );
}
