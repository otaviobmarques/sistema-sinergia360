import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { carregarTags, carregarVencimentos } from '@/lib/dados';
import { TIPOS_PRAZO, fmtData, faixa, hojeISO } from '@/lib/format';
import { FiltroTag } from '@/components/Filtros';
import Tag from '@/components/Tag';
import { concluirPrazo } from '../actions';

const PERIODOS = [['vencidos', 'Só vencidos'], ['30', 'Até 30 dias'], ['60', 'Até 60 dias'], ['90', 'Até 90 dias'], ['180', 'Até 6 meses'], ['365', 'Até 12 meses'], ['todos', 'Todos']];
const TIPOS = [['', 'Todos'], ['iso', 'ISO (manutenção e recertificação)'], ['auditoria_interna', 'Auditoria interna'], ['seguro', 'Seguro RCP'], ['recredenciamento', 'Recredenciamento']];

export default async function Vencimentos({ searchParams }) {
  const sp = await searchParams;
  const filtros = { tipo: sp.tipo || '', periodo: sp.periodo || '90', tag: sp.tag || '' };
  const supabase = await createClient();
  const [tags, lista] = await Promise.all([carregarTags(supabase), carregarVencimentos(supabase, filtros)]);
  const tagPorId = new Map(tags.map((t) => [t.id, t]));
  const hoje = hojeISO();
  const vencidos = lista.filter((v) => v.data < hoje).length;
  return (<>
    <div className="topo">
      <div><div className="eyebrow">Relatório de vencimentos</div><h1>{lista.length} prazos em aberto</h1>
        <p>{vencidos} já vencidos. Inclui só clientes em carteira (ativos, em credenciamento e encerrando).</p></div>
      <a className="btn sec" href={`/api/export?rel=vencimentos&${new URLSearchParams(filtros)}`}>Exportar Excel (CSV)</a>
    </div>
    <form className="filtros painel">
      <label><span>Tipo de prazo</span><select id="v-tipo" name="tipo" defaultValue={filtros.tipo}>{TIPOS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
      <label><span>Período</span><select id="v-per" name="periodo" defaultValue={filtros.periodo}>{PERIODOS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
      <FiltroTag tags={tags} valor={filtros.tag} />
      <button className="btn">Filtrar</button>
    </form>
    <div className="tabela"><table>
      <thead><tr><th>Data</th><th>Falta</th><th>Prazo</th><th>Cliente</th><th>Tags</th><th>Cidade</th><th>Contato</th><th></th></tr></thead>
      <tbody>
        {lista.map((v) => { const f = faixa(v.data, hoje); return (
          <tr key={v.id + v.tipo}>
            <td className="num">{fmtData(v.data)}</td><td><span className={'pill ' + f.classe}>{f.rotulo}</span></td>
            <td>{TIPOS_PRAZO[v.tipo]}{v.detalhe ? <div className="sub">{v.detalhe}</div> : null}</td>
            <td><Link className="nome" href={`/clientes/${v.cliente_id}`}>{v.cliente.razao_social}</Link>{v.cliente.inadimplente && <div><span className="pill ruim">Inadimplente</span></div>}</td>
            <td><div className="pills">{v.cliente.tagIds.map((t) => <Tag key={t} t={tagPorId.get(t)} />)}</div></td>
            <td>{v.cliente.cidade || '—'}{v.cliente.uf ? ` · ${v.cliente.uf}` : ''}</td>
            <td className="sub">{v.cliente.contato}</td>
            <td>{v.tipo === 'seguro'
              ? <Link className="btn sec mini" href={`/clientes/${v.cliente_id}`}>Renovar</Link>
              : <form action={concluirPrazo}><input type="hidden" name="id" value={v.id} /><button className="btn mini">Realizado</button></form>}</td>
          </tr>
        ); })}
        {!lista.length && <tr><td colSpan={8} className="vazio">Nenhum prazo em aberto com esses filtros.</td></tr>}
      </tbody>
    </table></div>
  </>);
}
