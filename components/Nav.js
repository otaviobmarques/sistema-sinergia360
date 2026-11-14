'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const itens = [
  ['/', 'Dashboard'], ['/pendencias', 'Pendências'], ['/clientes', 'Clientes'], ['/vencimentos', 'Vencimentos'],
  ['/relatorios', 'Relatórios'], ['/financeiro', 'Financeiro'], ['/configuracoes', 'Administrativo'],
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
