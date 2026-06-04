import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hearth',
    short_name: 'Hearth',
    description: 'Homeschool learning management for Australian families',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F0D0B',
    theme_color: '#0F0D0B',
    icons: [
      {
        src: '/hearth_pwa_icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/hearth_pwa_icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
