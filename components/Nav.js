'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const itens = [
  ['/', 'Dashboard'], ['/clientes', 'Clientes'], ['/vencimentos', 'Vencimentos'],
  ['/relatorios', 'Relatórios'], ['/financeiro', 'Financeiro'], ['/configuracoes', 'Configurações'],
];
export default function Nav() {
  const path = usePathname();
  return (
    <nav>
      {itens.map(([href, nome]) => (
        <Link key={href} href={href} className={(href === '/' ? path === '/' : path.startsWith(href)) ? 'ativo' : ''}>{nome}</Link>
      ))}
    </nav>
  );
}
