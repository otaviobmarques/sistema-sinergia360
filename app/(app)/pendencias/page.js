import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { carregarTags, carregarPendencias, CATEGORIAS } from '@/lib/dados';
import { fmtDoc } from '@/lib/format';
import { FiltroTag } from '@/components/Filtros';

export default async function Pendencias({ searchParams }) {
  const sp = await searchParams;
  const filtros = { tag: sp.tag || '', cat: sp.cat || '', q: sp.q || '' };
  const supabase = await createClient();
  const [tags, { lista, totais, comPendencia, emCarteira }] = await Promise.all([carregarTags(supabase), carregarPendencias(supabase, filtros)]);
  const nomeTag = new Map(tags.map((t) => [t.id, t.nome]));
  const link = (cat) => '/pendencias?' + new URLSearchParams(Object.entries({ ...filtros, cat }).filter(([, v]) => v)).toString();
  const ordem = Object.keys(CATEGORIAS);
  return (<>
    <div className="topo">
      <div><div className="eyebrow">Pendências</div><h1>{comPendencia} de {emCarteira} clientes com algo a resolver</h1>
        <p>Uma linha por cliente em carteira, com tudo que está pendente: prazos vencidos ou a vencer em 30 dias, financeiro, ISO e cadastro. Os mais urgentes aparecem primeiro.</p></div>
      <a className="btn sec" href={`/api/export?rel=pendencias_cliente&${new URLSearchParams(filtros)}`}>Exportar Excel (CSV)</a>
    </div>

    <div className="kpis">
      {ordem.map((k) => (
        <Link key={k} href={link(filtros.cat === k ? '' : k)} className={'kpi ' + (CATEGORIAS[k][1] === 'neutro' ? '' : CATEGORIAS[k][1])} style={filtros.cat === k ? { outline: '2px solid var(--ink)' } : undefined}>
          <div className="v">{totais[k]}</div><div className="l">{CATEGORIAS[k][0]}</div>
        </Link>
      ))}
    </div>

    <form className="filtros painel">
      <label style={{ flex: '1 1 220px' }}><span>Busca</span><input id="p-q" name="q" defaultValue={filtros.q} placeholder="Nome, CNPJ, cidade, sócio" /></label>
      <FiltroTag tags={tags} valor={filtros.tag} />
      <label><span>Tipo de pendência</span><select id="p-cat" name="cat" defaultValue={filtros.cat}><option value="">Todas</option>{ordem.map((k) => <option key={k} value={k}>{CATEGORIAS[k][0]}</option>)}</select></label>
      <button className="btn">Filtrar</button><Link className="btn sec" href="/pendencias">Limpar</Link>
    </form>

    <div className="tabela"><table>
      <thead><tr><th>Cliente</th><th>Contato</th><th>Pendências</th><th></th></tr></thead>
      <tbody>
        {lista.map(({ cliente: c, itens }) => (
          <tr key={c.id}>
            <td style={{ minWidth: 240 }}><Link className="nome" href={`/clientes/${c.id}`}>{c.razao_social}</Link>
              <div className="sub num">{fmtDoc(c.documento)} · {c.cidade || '—'}{c.uf ? ` · ${c.uf}` : ''}</div>
              <div className="pills" style={{ marginTop: 4 }}>{c.tagIds.map((t) => <span key={t} className="pill ok">{nomeTag.get(t)}</span>)}</div></td>
            <td className="sub" style={{ minWidth: 150 }}>{c.contato || '—'}{c.email ? <div>{c.email}</div> : null}</td>
            <td>{ordem.filter((k) => itens.some((i) => i.cat === k)).map((k) => (
              <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'baseline', margin: '3px 0', flexWrap: 'wrap' }}>
                <span className={'pill ' + CATEGORIAS[k][1]}>{CATEGORIAS[k][0]}</span>
                <span>{itens.filter((i) => i.cat === k).map((i) => i.texto).join(' · ')}</span>
              </div>
            ))}</td>
            <td><Link className="btn sec mini" href={`/clientes/${c.id}`}>Resolver</Link></td>
          </tr>
        ))}
        {!lista.length && <tr><td colSpan={4} className="vazio">Nenhuma pendência com esses filtros.</td></tr>}
      </tbody>
    </table></div>
  </>);
}
