'use client';
import { useRef, useState } from 'react';

// Campo para colar um certificado ou chave, ou carregar o arquivo direto do computador.
export default function CampoBloco({ id, name, salvo }) {
  const ref = useRef(null);
  const [nome, setNome] = useState('');
  async function carregar(e) {
    const arq = e.target.files?.[0];
    if (!arq) return;
    ref.current.value = await arq.text();
    setNome(arq.name);
  }
  return (<>
    <textarea id={id} name={name} ref={ref} rows={4} spellCheck={false} autoComplete="off" style={{ fontFamily: 'var(--mono)', fontSize: 12 }}
      placeholder={salvo ? `Já salvo (${salvo}). Deixe em branco para manter.` : 'Cole o conteúdo do arquivo ou use o botão abaixo.'} />
    <div className="linha" style={{ marginTop: 6 }}>
      <label className="btn sec mini" style={{ display: 'inline-block' }}>Carregar arquivo<input type="file" onChange={carregar} style={{ display: 'none' }} accept=".pem,.key,.crt,.cer,.txt" /></label>
      {nome && <span className="sub">{nome} carregado</span>}
    </div>
  </>);
}
