import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER || 'SuiviCautionDSM@gmail.com',
        pass: process.env.SMTP_PASS || '',
    },
});

interface DossierEmailData {
    num_facture_caution?: string | null;
    montant_caution?: number | null;
    client_nom?: string | null;
    transitaire_nom?: string | null;
    armateur?: string | null;
    num_bl?: string | null;
    date_reception?: string | null;
    type_remboursement?: string | null;
}

export async function sendNewDossierEmail(to: string, dossier: DossierEmailData) {
    const montantFormatted = dossier.montant_caution
        ? new Intl.NumberFormat('fr-FR').format(dossier.montant_caution)
        : '—';

    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 2rem; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em;">
                🆕 Nouveau Dossier de Caution
            </h1>
            <p style="color: rgba(255,255,255,0.85); margin: 0.5rem 0 0 0; font-size: 0.95rem;">
                Un nouveau dossier vient d'être enregistré dans le système
            </p>
        </div>
    
        <!-- Body -->
        <div style="padding: 2rem;">
            <!-- Numéro facture en vedette -->
            <div style="background: white; border-radius: 10px; padding: 1.25rem; margin-bottom: 1.5rem; text-align: center; border: 2px solid #e2e8f0;">
                <p style="margin: 0; font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">N° Facture Caution</p>
                <p style="margin: 0.25rem 0 0 0; font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: 0.02em;">
                    ${dossier.num_facture_caution || '—'}
                </p>
            </div>

            <!-- Détails -->
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 0.9rem 1.25rem; font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; width: 40%;">Type</td>
                    <td style="padding: 0.9rem 1.25rem; font-weight: 600; color: #1e293b;">${dossier.type_remboursement || '—'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9; background: #f8fafc;">
                    <td style="padding: 0.9rem 1.25rem; font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Montant</td>
                    <td style="padding: 0.9rem 1.25rem; font-weight: 800; color: #4f46e5; font-size: 1.1rem;">${montantFormatted} FCFA</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 0.9rem 1.25rem; font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Client</td>
                    <td style="padding: 0.9rem 1.25rem; font-weight: 600; color: #1e293b;">${dossier.client_nom || '—'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9; background: #f8fafc;">
                    <td style="padding: 0.9rem 1.25rem; font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Transitaire</td>
                    <td style="padding: 0.9rem 1.25rem; font-weight: 600; color: #1e293b;">${dossier.transitaire_nom || '—'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 0.9rem 1.25rem; font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Armateur</td>
                    <td style="padding: 0.9rem 1.25rem; font-weight: 600; color: #1e293b;">${dossier.armateur || '—'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9; background: #f8fafc;">
                    <td style="padding: 0.9rem 1.25rem; font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">N° BL</td>
                    <td style="padding: 0.9rem 1.25rem; font-weight: 600; color: #1e293b;">${dossier.num_bl || '—'}</td>
                </tr>
                <tr>
                    <td style="padding: 0.9rem 1.25rem; font-size: 0.8rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Date réception</td>
                    <td style="padding: 0.9rem 1.25rem; font-weight: 600; color: #1e293b;">${dossier.date_reception || '—'}</td>
                </tr>
            </table>
        </div>

        <!-- Footer -->
        <div style="padding: 1.25rem 2rem; background: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 0.8rem; color: #94a3b8;">
                Cet email a été envoyé automatiquement par le système <strong>Suivi Caution DSM</strong>.
            </p>
        </div>
    </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Suivi Caution DSM" <${process.env.SMTP_USER || 'SuiviCautionDSM@gmail.com'}>`,
            to,
            subject: `📋 Nouveau Dossier Caution — ${dossier.num_facture_caution || 'N/A'}`,
            html,
        });
        console.log(`✅ Email envoyé à ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        return false;
    }
}
