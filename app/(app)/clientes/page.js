import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { carregarClientes, carregarTags, filtrarClientes } from '@/lib/dados';
import { SITUACOES, SIT_CLASSE, SERVICOS, UFS, fmtDoc, fmtData, fmtMoeda } from '@/lib/format';
import { FiltroTag } from '@/components/Filtros';
import Tag from '@/components/Tag';

export default async function Clientes({ searchParams }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [tags, todos] = await Promise.all([carregarTags(supabase), carregarClientes(supabase)]);
  const tagPorId = new Map(tags.map((t) => [t.id, t]));
  const lista = filtrarClientes(todos, sp);
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v)).toString();
  return (<>
    <div className="topo">
      <div><div className="eyebrow">Clientes</div><h1>{lista.length} de {todos.length} clientes</h1></div>
      <div className="linha"><a className="btn sec" href={`/api/export?rel=clientes&${qs}`}>Exportar Excel (CSV)</a><Link className="btn" href="/clientes/novo">Novo cliente</Link></div>
    </div>
    <form className="filtros painel">
      <label style={{ flex: '1 1 220px' }}><span>Busca</span><input id="f-q" name="q" defaultValue={sp.q || ''} placeholder="Nome, CNPJ, cidade, sócio" /></label>
      <FiltroTag tags={tags} valor={sp.tag} />
      <label><span>Situação</span><select id="f-sit" name="situacao" defaultValue={sp.situacao || ''}><option value="">Todas</option>{Object.entries(SITUACOES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <label><span>UF</span><select id="f-uf" name="uf" defaultValue={sp.uf || ''}><option value="">Todas</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></label>
      <label><span>Serviço</span><select id="f-serv" name="servico" defaultValue={sp.servico || ''}><option value="">Todos</option>{SERVICOS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <label className="check" style={{ paddingBottom: 8 }}><input id="f-inad" type="checkbox" name="inad" value="1" defaultChecked={!!sp.inad} /><span>Só inadimplentes</span></label>
      <button className="btn">Filtrar</button><Link className="btn sec" href="/clientes">Limpar</Link>
    </form>
    <div className="tabela"><table>
      <thead><tr><th>Cliente</th><th>Tags</th><th>Cidade</th><th>Situação</th><th>Serviços</th><th className="dir">Mensal</th><th>Seguro vence</th><th>ISO recert.</th></tr></thead>
      <tbody>
        {lista.map((c) => (
          <tr key={c.id}>
            <td><Link className="nome" href={`/clientes/${c.id}`}>{c.razao_social}</Link><div className="sub num">{fmtDoc(c.documento)}</div></td>
            <td><div className="pills">{c.tagIds.map((t) => <Tag key={t} t={tagPorId.get(t)} />)}</div></td>
            <td>{c.cidade || '—'}{c.uf ? ` · ${c.uf}` : ''}</td>
            <td><div className="pills"><span className={'pill ' + SIT_CLASSE[c.situacao]}>{SITUACOES[c.situacao]}</span>{c.inadimplente && <span className="pill ruim">Inadimplente</span>}{c.iso?.situacao === 'suspensa' && <span className="pill ruim">ISO suspensa</span>}</div></td>
            <td className="sub">{SERVICOS.filter(([k]) => c[k]).map(([, v]) => v.replace(' (SGQ)', '')).join(', ') || '—'}</td>
            <td className="dir num">{fmtMoeda(c.valor_mensal)}</td>
            <td className="num">{fmtData(c.apolice?.vencimento)}</td>
            <td className="num">{fmtData(c.iso?.data_recertificacao)}</td>
          </tr>
        ))}
        {!lista.length && <tr><td colSpan={8} className="vazio">Nenhum cliente com esses filtros.</td></tr>}
      </tbody>
    </table></div>
  </>);
}
