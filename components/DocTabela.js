import Link from 'next/link';
import { TIPOS_DOC, fmtData, fmtTamanho, faixa } from '@/lib/format';
import { removerDocumento } from '@/app/(app)/actions';

export default function DocTabela({ docs, hoje, clientes }) {
  return (
    <div className="tabela" style={{ marginBottom: 14 }}><table>
      <thead><tr>{clientes && <th>Cliente</th>}<th>Documento</th><th>Arquivo</th><th>Emissão</th><th>Vencimento</th><th>Situação</th><th></th></tr></thead>
      <tbody>
        {docs.map((d) => { const f = d.data_vencimento ? faixa(d.data_vencimento, hoje) : null; const c = clientes?.get(d.cliente_id); return (
          <tr key={d.id}>
            {clientes && <td>{c ? <Link className="nome" href={`/clientes/${c.id}#documentos`}>{c.razao_social}</Link> : '—'}</td>}
            <td>{TIPOS_DOC[d.tipo]}{d.titulo ? <div className="sub">{d.titulo}</div> : null}</td>
            <td><a href={`/api/documento/${d.id}`} target="_blank" rel="noreferrer">{d.arquivo_nome}</a><div className="sub">{fmtTamanho(d.tamanho)}{d.enviado_por ? ` · enviado por ${d.enviado_por}` : ''}</div></td>
            <td className="num">{fmtData(d.data_emissao)}</td><td className="num">{fmtData(d.data_vencimento)}</td>
            <td>{!d.vigente ? <span className="pill">Substituído</span> : f ? <span className={'pill ' + f.classe}>{f.rotulo}</span> : <span className="pill ok">Sem vencimento</span>}</td>
            <td><details><summary className="rotulo" style={{ cursor: 'pointer' }}>Excluir</summary>
              <form action={removerDocumento} style={{ marginTop: 6 }}><input type="hidden" name="id" value={d.id} /><button className="btn mini" style={{ background: 'var(--bad)', borderColor: 'var(--bad)' }}>Confirmar</button></form></details></td>
          </tr>
        ); })}
        {!docs.length && <tr><td colSpan={clientes ? 7 : 6} className="vazio">Nenhum documento enviado.</td></tr>}
      </tbody>
    </table></div>
  );
}
