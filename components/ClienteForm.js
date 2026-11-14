'use client';
import { useState, useTransition } from 'react';
import { salvarCliente } from '@/app/(app)/actions';
import { SITUACOES, SERVICOS, UFS, fmtDoc, soDigitos } from '@/lib/format';

export default function ClienteForm({ cliente, tags }) {
  const c = cliente || {};
  const [v, setV] = useState({
    documento: fmtDoc(c.documento).replace('—', ''), razao_social: c.razao_social || '', nome_fantasia: c.nome_fantasia || '',
    cidade: c.cidade || '', uf: c.uf || '', bairro: c.bairro || '', logradouro: c.logradouro || '', numero: c.numero || '',
    complemento: c.complemento || '', cep: c.cep || '', situacao_receita: c.situacao_receita || '',
    socios: c.socios || '', contato: c.contato || '', email: c.email || '',
  });
  const [situacao, setSituacao] = useState(c.situacao || 'ativo');
  const [msg, setMsg] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [salvando, iniciar] = useTransition();
  const campo = (k) => ({ id: 'c-' + k, name: k, value: v[k], onChange: (e) => setV({ ...v, [k]: e.target.value }) });

  async function buscar() {
    const d = soDigitos(v.documento);
    if (d.length !== 14) { setMsg({ erro: true, texto: 'Digite os 14 dígitos do CNPJ para buscar.' }); return; }
    setBuscando(true); setMsg(null);
    try {
      const r = await fetch(`/api/cnpj/${d}`); const j = await r.json();
      if (!r.ok) setMsg({ erro: true, texto: j.erro });
      else {
        // Só preenche o que está vazio, para não apagar o que a equipe já corrigiu.
        const novo = { ...v, documento: fmtDoc(d) };
        for (const k of Object.keys(j)) if (!novo[k] && j[k]) novo[k] = j[k];
        novo.situacao_receita = j.situacao_receita || novo.situacao_receita;
        setV(novo);
        setMsg({ texto: `Dados da Receita carregados. Situação cadastral: ${j.situacao_receita || 'não informada'}.` });
      }
    } catch { setMsg({ erro: true, texto: 'Não foi possível consultar a Receita agora. Preencha manualmente.' }); }
    setBuscando(false);
  }
  function enviar(formData) {
    iniciar(async () => { const r = await salvarCliente(formData); if (r?.erro) setMsg({ erro: true, texto: r.erro }); });
  }
  const encerra = ['encerrado', 'encerrando', 'paralisado'].includes(situacao);
  return (
    <form action={enviar} className="grid">
      {c.id && <input type="hidden" name="id" value={c.id} />}
      <input type="hidden" name="situacao_receita" value={v.situacao_receita} />
      {msg && <div className={'aviso' + (msg.erro ? ' erro' : '')} role="status">{msg.texto}</div>}

      <div className="painel t"><h2>Identificação</h2>
        <div className="campos">
          <label className="c4"><span>CNPJ ou CPF</span><input {...campo('documento')} placeholder="00.000.000/0000-00" inputMode="numeric" /></label>
          <div className="c3" style={{ alignSelf: 'end' }}><button type="button" className="btn teal" onClick={buscar} disabled={buscando}>{buscando ? 'Buscando…' : 'Buscar na Receita'}</button></div>
          <div className="c5" style={{ alignSelf: 'end' }}>{v.situacao_receita && <span className={'pill ' + (v.situacao_receita === 'ATIVA' ? 'ok' : 'ruim')}>Receita: {v.situacao_receita}</span>}</div>
          <label className="c8"><span>Razão social</span><input {...campo('razao_social')} required /></label>
          <label className="c4"><span>Nome fantasia</span><input {...campo('nome_fantasia')} /></label>
          <label className="c5"><span>Logradouro</span><input {...campo('logradouro')} /></label>
          <label className="c2"><span>Número</span><input {...campo('numero')} /></label>
          <label className="c3"><span>Complemento</span><input {...campo('complemento')} /></label>
          <label className="c2"><span>CEP</span><input {...campo('cep')} /></label>
          <label className="c4"><span>Bairro / unidade</span><input {...campo('bairro')} /></label>
          <label className="c6"><span>Cidade</span><input {...campo('cidade')} /></label>
          <label className="c2"><span>UF</span><select {...campo('uf')}><option value="">—</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></label>
        </div>
      </div>

      <div className="painel t"><h2>Contatos</h2>
        <div className="campos">
          <label className="c4"><span>Sócios</span><input {...campo('socios')} /></label>
          <label className="c4"><span>Contato (telefone e nome)</span><input {...campo('contato')} /></label>
          <label className="c4"><span>E-mail</span><input {...campo('email')} type="email" /></label>
        </div>
      </div>

      <div className="painel t"><h2>Tags, situação e contrato</h2>
        <div className="campos">
          <div className="c12"><div className="rotulo" style={{ marginBottom: 6 }}>Tags</div>
            <div className="linha">{tags.map((t) => (
              <label key={t.id} className="check"><input id={'tag-' + t.id} type="checkbox" name="tags" value={t.id} defaultChecked={c.tagIds?.includes(t.id)} /><span><i style={{ display: 'inline-block', width: 10, height: 10, background: t.cor, marginRight: 6 }} />{t.nome}</span></label>
            ))}</div>
          </div>
          <label className="c3"><span>Situação</span><select id="c-situacao" name="situacao" value={situacao} onChange={(e) => setSituacao(e.target.value)}>{Object.entries(SITUACOES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
          {encerra && <label className="c3"><span>Data</span><input id="c-dtenc" type="date" name="data_encerramento" defaultValue={c.data_encerramento || ''} /></label>}
          {encerra && <label className="c6"><span>Motivo</span><input id="c-motivo" name="motivo_encerramento" defaultValue={c.motivo_encerramento || ''} placeholder="Fechou a loja, distrato, não renovou…" /></label>}
          <label className="check c12"><input id="c-inad" type="checkbox" name="inadimplente" defaultChecked={c.inadimplente} /><span>Inadimplente</span></label>
          <div className="c12"><div className="rotulo" style={{ marginBottom: 6 }}>Serviços contratados</div>
            <div className="linha">{SERVICOS.map(([k, n]) => (
              <label key={k} className="check"><input id={'c-' + k} type="checkbox" name={k} defaultChecked={c[k]} /><span>{n}</span></label>
            ))}</div>
          </div>
          <label className="c3"><span>Valor mensal (R$)</span><input id="c-valor" name="valor_mensal" inputMode="decimal" defaultValue={c.valor_mensal != null ? String(c.valor_mensal).replace('.', ',') : ''} /></label>
          <label className="c3"><span>Dia do boleto</span><input id="c-dia" name="dia_boleto" type="number" min="1" max="31" defaultValue={c.dia_boleto || ''} /></label>
          <label className="c3"><span>Último boleto emitido</span><input id="c-ult" name="ultimo_boleto" type="month" defaultValue={c.ultimo_boleto?.slice(0, 7) || ''} /></label>
          <label className="c3"><span>Assinatura do contrato</span><input id="c-ass" name="data_assinatura" type="date" defaultValue={c.data_assinatura || ''} /></label>
          <label className="c12"><span>Observações</span><textarea id="c-obs" name="observacoes" defaultValue={c.observacoes || ''} /></label>
        </div>
      </div>
      <div className="linha"><button className="btn" disabled={salvando}>{salvando ? 'Salvando…' : c.id ? 'Salvar alterações' : 'Cadastrar cliente'}</button></div>
    </form>
  );
}
