'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { registrarDocumento } from '@/app/(app)/actions';
import { TIPOS_DOC } from '@/lib/format';

const LIMITE = 25 * 1024 * 1024;

export default function DocUpload({ clienteId }) {
  const router = useRouter();
  const [msg, setMsg] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const form = e.currentTarget, f = new FormData(form), arquivo = f.get('arquivo');
    if (!arquivo?.size) { setMsg({ erro: true, texto: 'Escolha um arquivo.' }); return; }
    if (arquivo.size > LIMITE) { setMsg({ erro: true, texto: 'O arquivo passa de 25 MB.' }); return; }
    setOcupado(true); setMsg(null);
    // O nome no armazenamento é técnico; o nome original fica guardado no cadastro do documento.
    const ext = (arquivo.name.match(/\.[A-Za-z0-9]{1,8}$/) || [''])[0].toLowerCase();
    const caminho = `${clienteId}/${crypto.randomUUID()}${ext}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from('documentos').upload(caminho, arquivo, { contentType: arquivo.type || undefined });
    if (error) { setMsg({ erro: true, texto: 'Falha ao enviar o arquivo: ' + error.message }); setOcupado(false); return; }
    const r = await registrarDocumento({
      cliente_id: clienteId, tipo: f.get('tipo'), titulo: f.get('titulo'), arquivo_path: caminho, arquivo_nome: arquivo.name,
      tamanho: arquivo.size, mime: arquivo.type, data_emissao: f.get('data_emissao'), data_vencimento: f.get('data_vencimento'),
      observacoes: f.get('observacoes'), substituir: f.get('substituir') === 'on',
    });
    if (r?.erro) { await supabase.storage.from('documentos').remove([caminho]); setMsg({ erro: true, texto: r.erro }); }
    else { form.reset(); setMsg({ texto: 'Documento enviado.' }); router.refresh(); }
    setOcupado(false);
  }
  return (
    <form onSubmit={enviar} className="campos">
      {msg && <div className={'aviso c12' + (msg.erro ? ' erro' : '')} role="status">{msg.texto}</div>}
      <label className="c3"><span>Tipo</span><select id="doc-tipo" name="tipo">{Object.entries(TIPOS_DOC).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
      <label className="c5"><span>Arquivo (até 25 MB)</span><input id="doc-arquivo" name="arquivo" type="file" required /></label>
      <label className="c2"><span>Emissão</span><input id="doc-emissao" name="data_emissao" type="date" /></label>
      <label className="c2"><span>Vencimento</span><input id="doc-venc" name="data_vencimento" type="date" /></label>
      <label className="c6"><span>Descrição (opcional)</span><input id="doc-titulo" name="titulo" placeholder="Ex.: apólice 2026/2027" /></label>
      <label className="c6"><span>Observações</span><input id="doc-obs" name="observacoes" /></label>
      <label className="check c8"><input id="doc-subst" name="substituir" type="checkbox" defaultChecked /><span>Substitui o documento vigente do mesmo tipo (o anterior fica no histórico)</span></label>
      <div className="c4" style={{ textAlign: 'right' }}><button className="btn" disabled={ocupado}>{ocupado ? 'Enviando…' : 'Enviar documento'}</button></div>
    </form>
  );
}
