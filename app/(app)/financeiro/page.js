import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { carregarClientes, carregarTags } from '@/lib/dados';
import { EM_CARTEIRA, SITUACOES, fmtMoeda, fmtMil, fmtMes, hojeISO } from '@/lib/format';
import { FiltroTag, Barras } from '@/components/Filtros';
import { marcarBoleto, alternarInadimplente } from '../actions';

export default async function Financeiro({ searchParams }) {
  const { tag = '' } = await searchParams;
  const supabase = await createClient();
  const [tags, todos] = await Promise.all([carregarTags(supabase), carregarClientes(supabase)]);
  const clientes = (tag ? todos.filter((c) => c.tagIds.includes(Number(tag))) : todos).filter((c) => c.valor_mensal != null);
  const soma = (l) => l.reduce((a, c) => a + Number(c.valor_mensal), 0);
  const carteira = clientes.filter((c) => EM_CARTEIRA.includes(c.situacao));
  const inad = carteira.filter((c) => c.inadimplente);
  const encerrando = carteira.filter((c) => c.situacao === 'encerrando');
  const paralisados = clientes.filter((c) => c.situacao === 'paralisado');
  const mes = hojeISO().slice(0, 8) + '01';
  const aEmitir = carteira.filter((c) => c.situacao !== 'em_credenciamento' && (!c.ultimo_boleto || c.ultimo_boleto < mes)).sort((a, b) => (a.dia_boleto || 99) - (b.dia_boleto || 99));
  const porTag = tags.filter((t) => t.tipo === 'franquia').map((t) => { const l = carteira.filter((c) => c.tagIds.includes(t.id)); return { nome: t.nome, valor: soma(l), rotulo: fmtMil(soma(l)) }; });
  const dias = [...new Set(carteira.map((c) => c.dia_boleto).filter(Boolean))].sort((a, b) => a - b);
  const porDia = dias.map((d) => { const l = carteira.filter((c) => c.dia_boleto === d); return { nome: `Dia ${d} · ${l.length} boletos`, valor: soma(l), rotulo: fmtMil(soma(l)) }; }).filter((x) => x.valor > 0);
  return (<>
    <div className="topo">
      <div><div className="eyebrow">Painel financeiro</div><h1>Receita mensal contratada</h1>
        <p>Valores dos contratos de clientes em carteira. Recebimentos e atrasos reais entram quando a emissão de boletos pelo Banco Cora for integrada.</p></div>
      <form className="filtros"><FiltroTag tags={tags} valor={tag} /><button className="btn sec">Filtrar</button></form>
    </div>
    <div className="kpis">
      <div className="kpi ok"><div className="v">{fmtMil(soma(carteira))}</div><div className="l">Contratado por mês · {carteira.length} clientes</div></div>
      <div className="kpi"><div className="v">{fmtMoeda(carteira.length ? soma(carteira) / carteira.length : 0)}</div><div className="l">Ticket médio</div></div>
      <Link className="kpi ruim" href="/clientes?inad=1"><div className="v">{fmtMil(soma(inad))}</div><div className="l">De inadimplentes · {inad.length}</div></Link>
      <div className="kpi alerta"><div className="v">{fmtMil(soma(encerrando))}</div><div className="l">De clientes encerrando · {encerrando.length}</div></div>
      <div className="kpi alerta"><div className="v">{fmtMil(soma(paralisados))}</div><div className="l">Parado em paralisados · {paralisados.length}</div></div>
    </div>
    <div className="grid g2">
      <div className="painel"><h2>Receita por franquia</h2><Barras itens={porTag} /></div>
      <div className="painel"><h2>Entrada prevista por dia de vencimento</h2><Barras itens={porDia} cor="b" /></div>
    </div>
    <div>
      <h2>Boletos de {fmtMes(mes)} ainda não emitidos ({aEmitir.length})</h2>
      <div className="tabela"><table>
        <thead><tr><th>Dia</th><th>Cliente</th><th>Situação</th><th className="dir">Valor</th><th>Último emitido</th><th></th></tr></thead>
        <tbody>{aEmitir.map((c) => (
          <tr key={c.id}><td className="num">{c.dia_boleto || '—'}</td>
            <td><Link className="nome" href={`/clientes/${c.id}`}>{c.razao_social}</Link></td>
            <td><div className="pills"><span className="pill">{SITUACOES[c.situacao]}</span>{c.inadimplente && <span className="pill ruim">Inadimplente</span>}</div></td>
            <td className="dir num">{fmtMoeda(c.valor_mensal)}</td><td>{fmtMes(c.ultimo_boleto)}</td>
            <td><div className="linha">
              <form action={marcarBoleto}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="mes" value={mes} /><button className="btn mini">Marcar emitido</button></form>
              <form action={alternarInadimplente}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="valor" value={c.inadimplente ? '0' : '1'} /><button className="btn sec mini">{c.inadimplente ? 'Tirar inadimplência' : 'Marcar inadimplente'}</button></form>
            </div></td></tr>
        ))}{!aEmitir.length && <tr><td colSpan={6} className="vazio">Todos os boletos do mês foram emitidos.</td></tr>}</tbody>
      </table></div>
    </div>
  </>);
}
