import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNewDossierEmail } from '@/lib/mailer';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.num_facture_caution) {
            return NextResponse.json({ error: 'Numéro de facture requis' }, { status: 400 });
        }

        // Extract the email before passing to Prisma (it's not a DB column)
        const notificationEmail = body.notification_email;
        delete body.notification_email;

        const newDossier = await prisma.dossiers_caution.create({
            data: {
                ...body,
                created_at: new Date(),
                updated_at: new Date(),
            }
        });

        // Send email notification (fire-and-forget, don't block the response)
        if (notificationEmail && notificationEmail.trim()) {
            sendNewDossierEmail(notificationEmail.trim(), newDossier).catch(err => {
                console.error('Email sending failed (non-blocking):', err);
            });
        }

        return NextResponse.json(newDossier);
    } catch (error) {
        console.error('Error creating dossier:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
