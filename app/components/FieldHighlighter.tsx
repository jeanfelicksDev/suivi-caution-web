'use client';
import { useEffect } from 'react';

export default function FieldHighlighter() {
    useEffect(() => {
        const checkFields = () => {
            document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), select, textarea').forEach((el: any) => {
                // We only color if the field actually has a value, and is not just an empty string or '0' (which might be default for numbers)
                const val = String(el.value).trim();
                if (val !== '' && val !== '0') {
                    // Exclure la barre de recherche globale en haut si possible
                    if (el.placeholder && (el.placeholder.includes('Entrez le numéro') || el.placeholder.includes('N° FACTURE'))) {
                        return;
                    }
                    el.classList.add('filled-field');
                } else {
                    el.classList.remove('filled-field');
                }
            });
        };

        // Executer au chargement
        checkFields();

        // Executer aux interactions clavier/souris sur les form
        document.addEventListener('input', checkFields);
        document.addEventListener('change', checkFields);

        // MutationObserver pour intercepter les popups ou le chargement de la DB via fetch React
        const observer = new MutationObserver(checkFields);
        observer.observe(document.body, { childList: true, subtree: true, attributes: false });

        const interval = setInterval(checkFields, 800);

        return () => {
            document.removeEventListener('input', checkFields);
            document.removeEventListener('change', checkFields);
            observer.disconnect();
            clearInterval(interval);
        };
    }, []);

    return null;
}
