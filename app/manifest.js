// Manifesto do aplicativo: permite instalar o sistema na tela inicial do celular ou do computador.
export default function manifest() {
  return {
    name: 'Sinergia 360 · Sistema de Gestão',
    short_name: 'Sinergia 360',
    description: 'Clientes, vencimentos de ISO e seguro, documentos e pendências da Sinergia 360.',
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0D1431',
    theme_color: '#0D1431',
    icons: [
      { src: '/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Pendências', url: '/pendencias' },
      { name: 'Vencimentos', url: '/vencimentos' },
      { name: 'Clientes', url: '/clientes' },
    ],
  };
}
