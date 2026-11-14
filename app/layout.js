import './globals.css';
import RegistrarSW from '@/components/RegistrarSW';

const descricao = 'Sistema de gestão da Sinergia 360: clientes, vencimentos de ISO e seguro, documentos e pendências.';
export const metadata = {
  metadataBase: new URL('https://gestao.sinergia360.com.br'),
  title: 'Sinergia 360 · Sistema de Gestão',
  description: descricao,
  applicationName: 'Sinergia 360',
  appleWebApp: { capable: true, title: 'Sinergia 360', statusBarStyle: 'black-translucent' },
  openGraph: { title: 'Sinergia 360 · Sistema de Gestão', description: descricao, siteName: 'Sinergia 360', locale: 'pt_BR', type: 'website', url: '/' },
  twitter: { card: 'summary_large_image', title: 'Sinergia 360 · Sistema de Gestão', description: descricao },
  robots: { index: false, follow: false },
};
export const viewport = { themeColor: '#0D1431', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@112..125,600..800&family=Public+Sans:wght@400;600;700&family=JetBrains+Mono:wght@500;700&display=swap" />
      </head>
      <body>{children}<RegistrarSW /></body>
    </html>
  );
}
