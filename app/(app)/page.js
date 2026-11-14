import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { carregarClientes, carregarTags, carregarVencimentos, pendenciasDe } from '@/lib/dados';
import { EM_CARTEIRA, MESES, hojeISO, addMeses, fmtData, faixa, TIPOS_PRAZO } from '@/lib/format';
import { FiltroTag, Barras } from '@/components/Filtros';

export default async function Dashboard({ searchParams }) {
  const { tag = '' } = await searchParams;
  const supabase = await createClient();
  const [tags, todos, venc] = await Promise.all([
    carregarTags(supabase), carregarClientes(supabase), carregarVencimentos(supabase, { periodo: 'todos', tag }),
  ]);
  const clientes = tag ? todos.filter((c) => c.tagIds.includes(Number(tag))) : todos;
  const hoje = hojeISO();
  const q = tag ? `&tag=${tag}` : '';
  const conta = (s) => clientes.filter((c) => c.situacao === s).length;
  const carteira = clientes.filter((c) => EM_CARTEIRA.includes(c.situacao));

  const meses = Array.from({ length: 12 }, (_, i) => addMeses(hoje.slice(0, 8) + '01', i).slice(0, 7));
  const serie = (teste) => meses.map((m) => venc.filter((v) => v.data >= hoje && v.data.slice(0, 7) === m && teste(v)).length);
  const sSeg = serie((v) => v.tipo === 'seguro'), sIso = serie((v) => v.tipo.startsWith('iso_')), sAud = serie((v) => v.tipo === 'auditoria_interna');
  const max = Math.max(1, ...sSeg, ...sIso, ...sAud);

  const vencidos = venc.filter((v) => v.data < hoje);
  const em30 = venc.filter((v) => v.data >= hoje && faixa(v.data, hoje).chave === '30');
  const fila = [
    { nome: 'Seguros vencidos', valor: vencidos.filter((v) => v.tipo === 'seguro').length, href: `/vencimentos?periodo=vencidos&tipo=seguro${q}` },
    { nome: 'ISO vencida', valor: vencidos.filter((v) => v.tipo.startsWith('iso_')).length, href: `/vencimentos?periodo=vencidos&tipo=iso${q}` },
    { nome: 'Auditorias atrasadas', valor: vencidos.filter((v) => v.tipo === 'auditoria_interna').length, href: `/vencimentos?periodo=vencidos&tipo=auditoria_interna${q}` },
    { nome: 'ISO suspensa', valor: carteira.filter((c) => c.iso?.situacao === 'suspensa').length, href: `/clientes?iso=suspensa${q}` },
    { nome: 'Cadastros com pendência', valor: carteira.filter((c) => pendenciasDe(c).length).length, href: `/pendencias?cat=cadastro${q}` },
  ];
  const proximos = venc.filter((v) => v.data >= hoje).slice(0, 8);
  const porUf = Object.entries(carteira.reduce((a, c) => ((a[c.uf || '—'] = (a[c.uf || '—'] || 0) + 1), a), {}))
    .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([nome, valor]) => ({ nome, valor, href: nome === '—' ? undefined : `/clientes?uf=${nome}${q}` }));

  return (<>
    <div className="topo">
      <div><div className="eyebrow">Dashboard · {fmtData(hoje)}</div><h1>Carteira e prazos</h1></div>
      <form className="filtros"><FiltroTag tags={tags} valor={tag} /><button className="btn sec">Filtrar</button></form>
    </div>

    <div className="kpis">
      <Link className="kpi ok" href={`/clientes?situacao=ativo${q}`}><div className="v">{conta('ativo')}</div><div className="l">Ativos</div></Link>
      <Link className="kpi" href={`/clientes?situacao=em_credenciamento${q}`}><div className="v">{conta('em_credenciamento')}</div><div className="l">Em credenciamento</div></Link>
      <Link className="kpi ruim" href={`/clientes?inad=1${q}`}><div className="v">{carteira.filter((c) => c.inadimplente).length}</div><div className="l">Inadimplentes</div></Link>
      <Link className="kpi alerta" href={`/clientes?situacao=paralisado${q}`}><div className="v">{conta('paralisado')}</div><div className="l">Paralisados</div></Link>
      <Link className="kpi ruim" href={`/vencimentos?periodo=vencidos${q}`}><div className="v">{vencidos.length}</div><div className="l">Prazos vencidos</div></Link>
      <Link className="kpi alerta" href={`/vencimentos?periodo=30${q}`}><div className="v">{em30.length}</div><div className="l">Vencem em 30 dias</div></Link>
    </div>

    <div className="painel">
      <h2>Prazos por mês nos próximos 12 meses</h2>
      <div className="chart" role="img" aria-label="Quantidade de seguros, prazos de ISO e auditorias internas por mês">
        {meses.map((m, i) => (
          <div className="col" key={m}>
            <div className="bar a" style={{ height: `${(sSeg[i] / max) * 100}%` }}><span>{sSeg[i] || ''}</span></div>
            <div className="bar b" style={{ height: `${(sIso[i] / max) * 100}%` }}><span>{sIso[i] || ''}</span></div>
            <div className="bar c" style={{ height: `${(sAud[i] / max) * 100}%` }}><span>{sAud[i] || ''}</span></div>
          </div>
        ))}
      </div>
      <div className="eixo">{meses.map((m) => <span key={m}>{MESES[+m.slice(5) - 1].slice(0, 3)}/{m.slice(2, 4)}</span>)}</div>
      <div className="legenda">
        <span><i style={{ background: 'var(--ink)' }} />Seguro RCP</span>
        <span><i style={{ background: 'var(--teal)' }} />ISO: manutenção ou recertificação</span>
        <span><i style={{ background: '#8992A6' }} />Auditoria interna</span>
      </div>
    </div>

    <div className="grid g2">
      <div className="painel"><h2>Fila de atenção</h2><Barras itens={fila} /></div>
      <div className="painel"><h2>Clientes em carteira por UF</h2><Barras itens={porUf} cor="b" /></div>
    </div>

    <div>
      <div className="topo" style={{ marginBottom: 10 }}><h2 style={{ margin: 0 }}>Próximos vencimentos</h2><Link className="btn sec mini" href={`/vencimentos?periodo=90${q}`}>Ver todos</Link></div>
      <div className="tabela"><table>
        <thead><tr><th>Cliente</th><th>Prazo</th><th>Data</th><th>Falta</th></tr></thead>
        <tbody>
          {proximos.map((v) => { const f = faixa(v.data, hoje); return (
            <tr key={v.id + v.tipo}><td><Link className="nome" href={`/clientes/${v.cliente_id}`}>{v.cliente.razao_social}</Link></td>
              <td>{TIPOS_PRAZO[v.tipo]}{v.detalhe ? ` · ${v.detalhe}` : ''}</td><td className="num">{fmtData(v.data)}</td><td><span className={'pill ' + f.classe}>{f.rotulo}</span></td></tr>
          ); })}
          {!proximos.length && <tr><td colSpan={4} className="vazio">Nenhum prazo futuro cadastrado.</td></tr>}
        </tbody>
      </table></div>
    </div>
  </>);
}
