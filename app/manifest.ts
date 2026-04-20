import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Suivi Caution AGL',
    short_name: 'SuiviCaution',
    description: 'Application de suivi des dossiers de caution AGL',
    start_url: '/consultation',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1D3557', // AGL Deep Blue
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
