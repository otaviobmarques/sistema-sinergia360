import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { carregarTags } from '@/lib/dados';
import ClienteForm from '@/components/ClienteForm';
import DocUpload from '@/components/DocUpload';
import DocTabela from '@/components/DocTabela';
import { ISO_SIT, TIPOS_PRAZO, SITUACOES, SIT_CLASSE, fmtData, fmtDoc, faixa, hojeISO } from '@/lib/format';
import { salvarIso, addPrazo, concluirPrazo, reabrirPrazo, removerPrazo, salvarApolice, removerApolice, addAnotacao } from '../../actions';

export default async function Cliente({ params, searchParams }) {
  const { id } = await params;
  const { salvo } = await searchParams;
  const supabase = await createClient();
  const [tags, { data: c }] = await Promise.all([
    carregarTags(supabase),
    supabase.from('clientes').select('*, cliente_tags(tag_id), iso_certificados(*), prazos(*), apolices(*), anotacoes(*), documentos(*)').eq('id', id).maybeSingle(),
  ]);
  if (!c) notFound();
  c.tagIds = c.cliente_tags.map((t) => t.tag_id);
  const iso = (Array.isArray(c.iso_certificados) ? c.iso_certificados[0] : c.iso_certificados) || {};
  const prazos = [...c.prazos].sort((a, b) => a.data_prevista.localeCompare(b.data_prevista));
  const apolices = [...c.apolices].sort((a, b) => Number(b.ativa) - Number(a.ativa) || (b.vencimento || '').localeCompare(a.vencimento || ''));
  const notas = [...c.anotacoes].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const hoje = hojeISO();
  return (<>
    <div className="topo">
      <div><div className="eyebrow"><Link href="/clientes">Clientes</Link> · {fmtDoc(c.documento)}</div><h1>{c.razao_social}</h1></div>
      <div className="pills"><span className={'pill ' + SIT_CLASSE[c.situacao]}>{SITUACOES[c.situacao]}</span>{c.inadimplente && <span className="pill ruim">Inadimplente</span>}</div>
    </div>
    {salvo && <div className="aviso">Cadastro salvo.</div>}

    <div className="grid g2">
      <div className="painel t"><h2>ISO 9001</h2>
        <form action={salvarIso} className="campos">
          <input type="hidden" name="cliente_id" value={c.id} />
          <label className="c6"><span>Emissão</span><input id="iso-em" type="date" name="data_emissao" defaultValue={iso.data_emissao || ''} /></label>
          <label className="c6"><span>Recertificação</span><input id="iso-rec" type="date" name="data_recertificacao" defaultValue={iso.data_recertificacao || ''} /></label>
          <label className="c6"><span>Situação</span><select id="iso-sit" name="situacao" defaultValue={iso.situacao || 'vigente'}>{Object.entries(ISO_SIT).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
          <label className="c6"><span>Motivo da suspensão</span><input id="iso-mot" name="motivo_suspensao" defaultValue={iso.motivo_suspensao || ''} /></label>
          <label className="check c12"><input id="iso-reg" type="checkbox" name="regerar" /><span>Recalcular prazos em aberto a partir da emissão (manutenções, recertificação e auditorias anuais)</span></label>
          <div className="c12"><button className="btn">Salvar ISO</button></div>
        </form>
      </div>

      <div className="painel t"><h2>Seguro RCP</h2>
        <div className="tabela" style={{ marginBottom: 14 }}><table>
          <thead><tr><th>Seguradora</th><th>Apólice</th><th>Vencimento</th><th></th><th></th></tr></thead>
          <tbody>
            {apolices.map((a) => { const f = a.vencimento && a.ativa ? faixa(a.vencimento, hoje) : null; return (
              <tr key={a.id}><td>{a.seguradora || '—'}</td><td>{a.numero || '—'}</td><td className="num">{fmtData(a.vencimento)}</td>
                <td>{f ? <span className={'pill ' + f.classe}>{f.rotulo}</span> : <span className="pill">Anterior</span>}</td>
                <td><form action={removerApolice}><input type="hidden" name="id" value={a.id} /><button className="btn sec mini">Excluir</button></form></td></tr>
            ); })}
            {!apolices.length && <tr><td colSpan={5} className="vazio">Nenhuma apólice cadastrada.</td></tr>}
          </tbody>
        </table></div>
        <form action={salvarApolice} className="campos">
          <input type="hidden" name="cliente_id" value={c.id} />
          <label className="c4"><span>Seguradora</span><input id="ap-seg" name="seguradora" list="seguradoras" required /></label>
          <datalist id="seguradoras"><option>AKAD</option><option>ZURICH</option><option>PORTO</option><option>TOKIO MARINE</option><option>AXA</option></datalist>
          <label className="c4"><span>Nº da apólice</span><input id="ap-num" name="numero" /></label>
          <label className="c4"><span>Vencimento</span><input id="ap-venc" type="date" name="vencimento" required /></label>
          <div className="c12"><button className="btn">Registrar nova apólice ou renovação</button><p className="nota">A apólice anterior fica no histórico.</p></div>
        </form>
      </div>
    </div>

    <div className="painel t"><h2>Prazos</h2>
      <div className="tabela" style={{ marginBottom: 14 }}><table>
        <thead><tr><th>Prazo</th><th>Data prevista</th><th>Situação</th><th>Observações</th><th></th></tr></thead>
        <tbody>
          {prazos.map((p) => { const f = faixa(p.data_prevista, hoje); return (
            <tr key={p.id}><td>{TIPOS_PRAZO[p.tipo]}</td><td className="num">{fmtData(p.data_prevista)}</td>
              <td>{p.data_realizada ? <span className="pill ok">Realizado em {fmtData(p.data_realizada)}</span> : <span className={'pill ' + f.classe}>{f.rotulo}</span>}</td>
              <td className="sub">{p.observacoes}</td>
              <td><div className="linha">
                {p.data_realizada
                  ? <form action={reabrirPrazo}><input type="hidden" name="id" value={p.id} /><button className="btn sec mini">Reabrir</button></form>
                  : <form action={concluirPrazo}><input type="hidden" name="id" value={p.id} /><button className="btn mini">Marcar realizado</button></form>}
                <form action={removerPrazo}><input type="hidden" name="id" value={p.id} /><button className="btn sec mini">Excluir</button></form>
              </div></td></tr>
          ); })}
          {!prazos.length && <tr><td colSpan={5} className="vazio">Nenhum prazo. Informe a emissão da ISO e marque "Recalcular prazos", ou adicione abaixo.</td></tr>}
        </tbody>
      </table></div>
      <form action={addPrazo} className="filtros">
        <input type="hidden" name="cliente_id" value={c.id} />
        <label><span>Tipo</span><select id="pz-tipo" name="tipo">{Object.entries(TIPOS_PRAZO).filter(([k]) => k !== 'seguro').map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
        <label><span>Data prevista</span><input id="pz-data" type="date" name="data_prevista" required /></label>
        <label style={{ flex: '1 1 200px' }}><span>Observações</span><input id="pz-obs" name="observacoes" /></label>
        <button className="btn sec">Adicionar prazo</button>
      </form>
    </div>

    <div className="painel t" id="documentos"><h2>Documentos</h2>
      <DocTabela docs={[...c.documentos].sort((a, b) => Number(b.vigente) - Number(a.vigente) || b.created_at.localeCompare(a.created_at))} hoje={hoje} />
      <DocUpload clienteId={c.id} />
    </div>

    <div className="painel t"><h2>Histórico de anotações</h2>
      <form action={addAnotacao} className="filtros" style={{ marginBottom: 14 }}>
        <input type="hidden" name="cliente_id" value={c.id} />
        <label style={{ flex: '1 1 320px' }}><span>Nova anotação</span><input id="nota-txt" name="texto" required placeholder="Ex.: solicitada a documentação atualizada" /></label>
        <button className="btn sec">Registrar</button>
      </form>
      {notas.map((n) => (
        <div key={n.id} style={{ borderTop: '1px solid var(--line)', padding: '10px 0' }}>
          <div className="rotulo">{new Date(n.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · {n.autor_email || 'importado da planilha'}</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{n.texto}</div>
        </div>
      ))}
      {!notas.length && <p className="nota">Nenhuma anotação ainda.</p>}
    </div>

    <ClienteForm cliente={c} tags={tags} />
  </>);
}
