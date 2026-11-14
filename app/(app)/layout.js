import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Nav from '@/components/Nav';
import { sair } from './actions';

export default async function AppLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membro } = await supabase.from('equipe').select('papel, bloqueado').eq('user_id', user.id).maybeSingle();

  if (!membro || membro.bloqueado) {
    return (
      <div className="login"><div className="cx">
        <img src="/logo-claro.png" alt="Sinergia 360" />
        <h2>{membro?.bloqueado ? 'Acesso bloqueado' : 'Acesso não liberado'}</h2>
        <p style={{ margin: 0 }}>A conta <strong>{user.email}</strong> não tem acesso ao sistema. Fale com um administrador da Sinergia 360.</p>
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
        <div className="dev"><span>Desenvolvido por</span><img src="/domma-escuro.png" alt="Domma Tecnologia" /></div>
      </aside>
      <main>{children}
        <div className="dev-rodape"><span>Desenvolvido por</span><img src="/domma-claro.png" alt="Domma Tecnologia" /></div>
      </main>
    </div>
  );
}
