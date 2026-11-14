'use client';
import { useState } from 'react';

// Abre o e-mail já escrito com o link do sistema, ou copia a mensagem para mandar por WhatsApp.
export default function EnviarLink({ email, nome }) {
  const [copiado, setCopiado] = useState(false);
  const interno = email.endsWith('@gestao.sinergia360.com.br');
  const login = interno ? email.split('@')[0] : email;
  const texto = () => `Olá${nome ? ', ' + nome : ''}!\n\nSeu acesso ao sistema de gestão da Sinergia 360 está liberado.\n\nLink: ${window.location.origin}\nUsuário: ${login}\nSenha: a que foi combinada com você. Depois de entrar, troque em Administrativo › Trocar minha senha.`;
  async function copiar() {
    try { await navigator.clipboard.writeText(texto()); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch { window.prompt('Copie a mensagem:', texto()); }
  }
  return (<>
    {!interno && <a className="btn sec mini" onClick={(e) => { e.currentTarget.href = `mailto:${email}?subject=${encodeURIComponent('Seu acesso ao sistema Sinergia 360')}&body=${encodeURIComponent(texto())}`; }} href={`mailto:${email}`}>Enviar link</a>}
    <button type="button" className="btn sec mini" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar mensagem'}</button>
  </>);
}
