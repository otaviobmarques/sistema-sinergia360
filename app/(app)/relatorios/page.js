import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { carregarClientes, carregarTags, pendenciasDe } from '@/lib/dados';
import { SITUACOES, EM_CARTEIRA, fmtDoc, fmtMoeda } from '@/lib/format';
import { FiltroTag } from '@/components/Filtros';

const ABAS = [['carteira', 'Carteira por tag e UF'], ['pendencias', 'Pendências de cadastro'], ['encerrados', 'Encerrados e paralisados']];

export default async function Relatorios({ searchParams }) {
  const sp = await searchParams;
  const r = sp.r || 'carteira', tag = sp.tag || '';
  const supabase = await createClient();
  const [tags, todos] = await Promise.all([carregarTags(supabase), carregarClientes(supabase)]);
  const clientes = tag ? todos.filter((c) => c.tagIds.includes(Number(tag))) : todos;
  const sits = Object.keys(SITUACOES);
  const linhaTag = (nome, lista, href) => ({ nome, href, n: sits.map((s) => lista.filter((c) => c.situacao === s).length), total: lista.length, mrr: lista.filter((c) => EM_CARTEIRA.includes(c.situacao)).reduce((a, c) => a + Number(c.valor_mensal || 0), 0) });
  const porTag = [...tags.map((t) => linhaTag(t.nome, todos.filter((c) => c.tagIds.includes(t.id)), `/clientes?tag=${t.id}`)), linhaTag('Sem tag', todos.filter((c) => !c.tagIds.length)), linhaTag('Total', todos, '/clientes')];
  const ufs = [...new Set(clientes.map((c) => c.uf || '—'))].sort();
  const porUf = ufs.map((u) => linhaTag(u, clientes.filter((c) => (c.uf || '—') === u), u === '—' ? undefined : `/clientes?uf=${u}${tag ? `&tag=${tag}` : ''}`)).sort((a, b) => b.total - a.total);
  const pend = clientes.filter((c) => EM_CARTEIRA.includes(c.situacao)).map((c) => ({ c, p: pendenciasDe(c) })).filter((x) => x.p.length);
  const fora = clientes.filter((c) => ['encerrado', 'paralisado', 'encerrando'].includes(c.situacao));
  const Tabela = ({ titulo, linhas }) => (
    <div><h2>{titulo}</h2><div className="tabela"><table>
      <thead><tr><th></th>{sits.map((s) => <th key={s} className="dir">{SITUACOES[s]}</th>)}<th className="dir">Total</th><th className="dir">Mensal em carteira</th></tr></thead>
      <tbody>{linhas.map((l) => (
        <tr key={l.nome}><td>{l.href ? <Link className="nome" href={l.href}>{l.nome}</Link> : <strong>{l.nome}</strong>}</td>
          {l.n.map((n, i) => <td key={i} className="dir num">{n || '—'}</td>)}<td className="dir num"><strong>{l.total}</strong></td><td className="dir num">{fmtMoeda(l.mrr)}</td></tr>
      ))}</tbody>
    </table></div></div>
  );
  return (<>
    <div className="topo">
      <div><div className="eyebrow">Relatórios</div><h1>{ABAS.find((a) => a[0] === r)?.[1]}</h1>
        <p>O relatório de prazos de ISO, auditoria interna e seguro fica em <Link href="/vencimentos">Vencimentos</Link>.</p></div>
      <a className="btn sec" href={`/api/export?rel=${r === 'carteira' ? 'clientes' : r}&tag=${tag}`}>Exportar Excel (CSV)</a>
    </div>
    <form className="filtros painel">
      <label><span>Relatório</span><select id="r-rel" name="r" defaultValue={r}>{ABAS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
      <FiltroTag tags={tags} valor={tag} /><button className="btn">Abrir</button>
    </form>
    {r === 'carteira' && <><Tabela titulo="Por tag" linhas={porTag} /><Tabela titulo="Por UF" linhas={porUf} /></>}
    {r === 'pendencias' && <div className="tabela"><table>
      <thead><tr><th>Cliente</th><th>CNPJ / CPF</th><th>Pendências ({pend.reduce((a, x) => a + x.p.length, 0)})</th></tr></thead>
      <tbody>{pend.map(({ c, p }) => (
        <tr key={c.id}><td><Link className="nome" href={`/clientes/${c.id}`}>{c.razao_social}</Link></td><td className="num">{fmtDoc(c.documento)}</td>
          <td><div className="pills">{p.map((x) => <span key={x} className="pill alerta">{x}</span>)}</div></td></tr>
      ))}{!pend.length && <tr><td colSpan={3} className="vazio">Nenhuma pendência.</td></tr>}</tbody>
    </table></div>}
    {r === 'encerrados' && <div className="tabela"><table>
      <thead><tr><th>Cliente</th><th>Situação</th><th>Data</th><th>Motivo</th><th className="dir">Mensal</th></tr></thead>
      <tbody>{fora.map((c) => (
        <tr key={c.id}><td><Link className="nome" href={`/clientes/${c.id}`}>{c.razao_social}</Link></td><td>{SITUACOES[c.situacao]}</td>
          <td className="num">{c.data_encerramento ? c.data_encerramento.split('-').reverse().join('/') : '—'}</td><td className="sub">{c.motivo_encerramento || c.observacoes}</td><td className="dir num">{fmtMoeda(c.valor_mensal)}</td></tr>
      ))}</tbody>
    </table></div>}
  </>);
}
