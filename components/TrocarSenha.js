'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TrocarSenha() {
  const [msg, setMsg] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  async function enviar(e) {
    e.preventDefault();
    const form = e.currentTarget, f = new FormData(form);
    if (f.get('nova') !== f.get('repete')) { setMsg({ erro: true, texto: 'As duas senhas não são iguais.' }); return; }
    setOcupado(true);
    const { error } = await createClient().auth.updateUser({ password: f.get('nova') });
    setMsg(error ? { erro: true, texto: error.message } : { texto: 'Senha alterada.' });
    if (!error) form.reset();
    setOcupado(false);
  }
  return (
    <form onSubmit={enviar} className="grid">
      {msg && <div className={'aviso' + (msg.erro ? ' erro' : '')} role="status">{msg.texto}</div>}
      <label><span>Nova senha</span><input id="ts-nova" name="nova" type="password" minLength={8} required autoComplete="new-password" /></label>
      <label><span>Repita a nova senha</span><input id="ts-repete" name="repete" type="password" minLength={8} required autoComplete="new-password" /></label>
      <div><button className="btn" disabled={ocupado}>{ocupado ? 'Salvando…' : 'Alterar senha'}</button></div>
    </form>
  );
}
