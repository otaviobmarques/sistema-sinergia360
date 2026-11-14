import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Nav from '@/components/Nav';
import { sair } from './actions';

export default async function AppLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membro } = await supabase.from('equipe').select('papel').eq('user_id', user.id).maybeSingle();

  if (!membro) {
    return (
      <div className="login"><div className="cx">
        <img src="/logo-claro.png" alt="Sinergia 360" />
        <h2>Acesso aguardando liberação</h2>
        <p style={{ margin: 0 }}>A conta <strong>{user.email}</strong> foi criada, mas ainda não está na equipe. Peça a um administrador para liberar este e-mail em Configurações.</p>
        <form action={sair}><button className="btn sec">Sair</button></form>
      </div></div>
    );
  }
  return (
    <div className="shell">
      <aside className="side">
        <img src="/logo-escuro.png" alt="Sinergia 360 Consultoria Empresarial" />
        <Nav />
        <div className="pe">
          <span>{user.email.replace('@gestao.sinergia360.com.br', '')}</span>
          <form action={sair}><button>Sair</button></form>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
