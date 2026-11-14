import Link from 'next/link';

// Formulário GET: os filtros ficam na URL, então qualquer visão pode ser salva ou compartilhada.
export function FiltroTag({ tags, valor }) {
  return (
    <label><span>Tag / franquia</span>
      <select name="tag" id="f-tag" defaultValue={valor || ''}>
        <option value="">Todas</option>
        {tags.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
      </select>
    </label>
  );
}
export function Barras({ itens, cor = '', href }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return itens.map((i) => {
    const corpo = (<>
      <span>{i.nome}</span>
      <div className="trilho"><div className={'cheio ' + cor} style={{ width: `${(i.valor / max) * 100}%` }} /></div>
      <span className="n">{i.rotulo ?? i.valor}</span>
    </>);
    return i.href ? <Link key={i.nome} className="hb" href={i.href}>{corpo}</Link> : <div key={i.nome} className="hb">{corpo}</div>;
  });
}
