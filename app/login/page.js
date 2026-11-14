'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Login() {
  const router = useRouter();
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setOcupado(true); setErro(null);
    const f = new FormData(e.currentTarget);
    // Quem entra com nome de usuário (sem @) usa a conta interna do sistema.
    const digitado = f.get('email').trim();
    const email = digitado.includes('@') ? digitado : `${digitado.toLowerCase()}@gestao.sinergia360.com.br`;
    const { error } = await createClient().auth.signInWithPassword({ email, password: f.get('senha') });
    if (!error) { router.replace('/'); router.refresh(); return; }
    setErro(error.message === 'Invalid login credentials' ? 'Usuário ou senha incorretos.' : error.message);
    setOcupado(false);
  }
  return (
    <div className="login">
      <form className="cx" onSubmit={enviar}>
        <img src="/logo-claro.png" alt="Sinergia 360 Consultoria Empresarial" />
        <h2 style={{ margin: 0 }}>Entrar no sistema de gestão</h2>
        {erro && <div className="aviso erro" role="alert">{erro}</div>}
        <label><span>E-mail ou usuário</span><input id="email" name="email" type="text" required autoComplete="username" /></label>
        <label><span>Senha</span><input id="senha" name="senha" type="password" required autoComplete="current-password" /></label>
        <button className="btn" disabled={ocupado}>{ocupado ? 'Aguarde…' : 'Entrar'}</button>
        <p className="nota" style={{ margin: 0 }}>O acesso é criado por um administrador em Administrativo › Usuários do sistema.</p>
      </form>
    </div>
  );
}
