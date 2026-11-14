'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Login() {
  const router = useRouter();
  const [modo, setModo] = useState('entrar');
  const [msg, setMsg] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setOcupado(true); setMsg(null);
    const f = new FormData(e.currentTarget);
    const email = f.get('email').trim(), password = f.get('senha');
    const supabase = createClient();
    if (modo === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ erro: true, texto: error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message === 'Email not confirmed' ? 'Confirme o e-mail pelo link que enviamos antes de entrar.' : error.message });
      else { router.replace('/'); router.refresh(); return; }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) setMsg({ erro: true, texto: error.message });
      else if (data.session) { router.replace('/'); router.refresh(); return; }
      else { setMsg({ texto: 'Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre.' }); setModo('entrar'); }
    }
    setOcupado(false);
  }
  return (
    <div className="login">
      <form className="cx" onSubmit={enviar}>
        <img src="/logo-claro.png" alt="Sinergia 360 Consultoria Empresarial" />
        <h2 style={{ margin: 0 }}>{modo === 'entrar' ? 'Entrar no sistema de gestão' : 'Criar conta de acesso'}</h2>
        {msg && <div className={'aviso' + (msg.erro ? ' erro' : '')}>{msg.texto}</div>}
        <label><span>E-mail</span><input id="email" name="email" type="email" required autoComplete="email" /></label>
        <label><span>Senha</span><input id="senha" name="senha" type="password" required minLength={8} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} /></label>
        <button className="btn" disabled={ocupado}>{ocupado ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
        <button type="button" className="btn sec" onClick={() => { setMsg(null); setModo(modo === 'entrar' ? 'criar' : 'entrar'); }}>
          {modo === 'entrar' ? 'Primeiro acesso: criar conta' : 'Já tenho conta'}
        </button>
        <p className="nota" style={{ margin: 0 }}>Só e-mails liberados por um administrador acessam os dados.</p>
      </form>
    </div>
  );
}
