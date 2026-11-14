import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { carregarClientes, carregarTags, carregarDocumentos, documentosFaltando } from '@/lib/dados';
import { EM_CARTEIRA, TIPOS_DOC, hojeISO, addDias, fmtDoc } from '@/lib/format';
import { FiltroTag } from '@/components/Filtros';
import DocTabela from '@/components/DocTabela';

const VISOES = [['vigentes', 'Vigentes'], ['vencidos', 'Vencidos'], ['90', 'Vencem em 90 dias'], ['faltando', 'Faltando'], ['todos', 'Todos, com histórico']];

export default async function Documentos({ searchParams }) {
  const sp = await searchParams;
  const f = { v: sp.v || 'vigentes', tipo: sp.tipo || '', tag: sp.tag || '' };
  const supabase = await createClient();
  const [tags, todos, docs] = await Promise.all([carregarTags(supabase), carregarClientes(supabase), carregarDocumentos(supabase)]);
  const hoje = hojeISO(), em90 = addDias(hoje, 90);
  const clientes = todos.filter((c) => !f.tag || c.tagIds.includes(Number(f.tag)));
  const ids = new Set(clientes.map((c) => c.id)), porId = new Map(clientes.map((c) => [c.id, c]));
  const meus = docs.filter((d) => ids.has(d.cliente_id) && (!f.tipo || d.tipo === f.tipo));
  const vigentes = meus.filter((d) => d.vigente);
  const vencidos = vigentes.filter((d) => d.data_vencimento && d.data_vencimento < hoje);
  const proximos = vigentes.filter((d) => d.data_vencimento && d.data_vencimento >= hoje && d.data_vencimento <= em90);
  const faltando = clientes.filter((c) => EM_CARTEIRA.includes(c.situacao))
    .map((c) => ({ c, falta: documentosFaltando(c, docs.filter((d) => d.cliente_id === c.id)).filter((t) => !f.tipo || t === f.tipo) }))
    .filter((x) => x.falta.length);
  const lista = { vigentes, vencidos, 90: proximos, todos: meus }[f.v] || vigentes;
  const link = (v) => '/documentos?' + new URLSearchParams(Object.entries({ ...f, v }).filter(([, x]) => x)).toString();
  const Kpi = ({ v, n, rotulo, classe }) => <Link href={link(v)} className={'kpi ' + classe} style={f.v === v ? { outline: '2px solid var(--ink)' } : undefined}><div className="v">{n}</div><div className="l">{rotulo}</div></Link>;
  return (<>
    <div className="topo"><div><div className="eyebrow">Documentos</div><h1>Arquivos dos clientes</h1>
      <p>Apólices, certificados, manuais e contratos, cada um com data de vencimento. Para enviar um arquivo, abra a ficha do cliente.</p></div></div>
    <div className="kpis">
      <Kpi v="vigentes" n={vigentes.length} rotulo="Documentos vigentes" classe="ok" />
      <Kpi v="vencidos" n={vencidos.length} rotulo="Vencidos" classe="ruim" />
      <Kpi v="90" n={proximos.length} rotulo="Vencem em 90 dias" classe="alerta" />
      <Kpi v="faltando" n={faltando.length} rotulo="Clientes com documento faltando" classe="alerta" />
    </div>
    <form className="filtros painel">
      <label><span>Visão</span><select id="d-v" name="v" defaultValue={f.v}>{VISOES.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
      <label><span>Tipo</span><select id="d-tipo" name="tipo" defaultValue={f.tipo}><option value="">Todos</option>{Object.entries(TIPOS_DOC).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
      <FiltroTag tags={tags} valor={f.tag} /><button className="btn">Filtrar</button>
    </form>
    {f.v === 'faltando' ? (
      <div className="tabela"><table>
        <thead><tr><th>Cliente</th><th>CNPJ / CPF</th><th>Documentos que faltam</th><th></th></tr></thead>
        <tbody>{faltando.map(({ c, falta }) => (
          <tr key={c.id}><td><Link className="nome" href={`/clientes/${c.id}#documentos`}>{c.razao_social}</Link></td><td className="num">{fmtDoc(c.documento)}</td>
            <td><div className="pills">{falta.map((t) => <span key={t} className="pill alerta">{TIPOS_DOC[t]}</span>)}</div></td>
            <td><Link className="btn sec mini" href={`/clientes/${c.id}#documentos`}>Enviar</Link></td></tr>
        ))}{!faltando.length && <tr><td colSpan={4} className="vazio">Nenhum documento faltando.</td></tr>}</tbody>
      </table></div>
    ) : <DocTabela docs={lista} hoje={hoje} clientes={porId} />}
    <p className="nota">Faltando considera o contrato: apólice para quem tem seguro, certificado para quem tem ISO emitida e manual da qualidade para quem tem auditoria interna (SGQ).</p>
  </>);
}
