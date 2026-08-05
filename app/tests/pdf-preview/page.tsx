'use client';

import { SedreStudyDocument } from "@/lib/pdf-generator";
import { mockStudy } from "@/tests/pdf/mock-study";
import { PDFViewer } from '@react-pdf/renderer';
/**
 * Page de dev pour itérer sur le layout du PDF sans avoir à le
 * télécharger et l'ouvrir à chaque changement.
 *
 * Accès : http://localhost:3000/tests/pdf-preview
 *
 * ⚠️ À ne pas déployer en prod telle quelle — soit tu la supprimes
 * avant la mise en ligne, soit tu la protèges derrière le check
 * admin (proxy.ts couvre déjà /admin, pas /tests).
 */
export default function PdfPreviewPage() {
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #ddd', fontFamily: 'sans-serif' }}>
                <strong>Preview PDF — données factices</strong>{' '}
                <span style={{ color: '#666' }}>
                    (édite tests/pdf/mock-study.ts pour changer les données, ou lib/pdf-generator.tsx pour le layout —
                    rechargement à chaud à chaque sauvegarde)
                </span>
            </div>
            <PDFViewer width="100%" height="100%" style={{ border: 'none', flex: 1 }}>
                <SedreStudyDocument study={mockStudy} />
            </PDFViewer>
        </div>
    );
}