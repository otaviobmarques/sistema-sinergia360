import { createClient } from '@/lib/supabase/server';
import { INTEGRACOES, situacaoIntegracao } from '@/lib/integracoes';
import CampoBloco from '@/components/CampoBloco';
import { salvarIntegracao } from '../actions';

export default async function Integracoes({ searchParams }) {
  const { ok, erro } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: linhas }, { data: eu }] = await Promise.all([
    supabase.from('integracoes').select('*'),
    supabase.from('equipe').select('papel').eq('user_id', user.id).maybeSingle(),
  ]);
  const admin = eu?.papel === 'admin';
  const porChave = Object.fromEntries((linhas || []).map((l) => [l.chave, l]));
  return (<>
    <div className="topo"><div><div className="eyebrow">Integrações</div><h1>Conexões do sistema com outros serviços</h1>
      <p>Preencha as chaves e os links de cada serviço. Chaves, certificados e senhas ficam num cofre criptografado: depois de salvos, não aparecem mais na tela, só os últimos caracteres.</p></div></div>
    {ok && <div className="aviso" role="status">Integração salva.</div>}
    {erro && <div className="aviso erro" role="alert">{erro}</div>}
    {!admin && <div className="aviso">Só usuários com perfil Admin alteram as integrações.</div>}

    {Object.entries(INTEGRACOES).map(([chave, def]) => {
      const linha = porChave[chave] || {}, cfg = linha.config || {}, seg = linha.segredos || {};
      const sit = situacaoIntegracao(chave, linha);
      return (
        <form key={chave} action={salvarIntegracao} className="painel t" id={chave} style={{ display: 'grid', gap: 14 }}>
          <input type="hidden" name="chave" value={chave} />
          <div className="linha" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>{def.nome}</h2>
            <span className={'pill ' + (sit.completa ? 'ok' : '')}>{sit.completa ? 'Credenciais salvas' : 'Faltam dados'}</span>
          </div>
          <p style={{ margin: 0, color: 'var(--ink2)', maxWidth: '80ch' }}>{def.resumo}</p>
          {def.ajuda && <p className="nota" style={{ margin: 0, maxWidth: '90ch' }}><strong>Onde conseguir:</strong> {def.ajuda}</p>}
          <fieldset disabled={!admin} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <div className="campos">
              {def.campos.map((c) => {
                const id = `${chave}-${c.k}`, nome = (c.segredo ? 's_' : 'c_') + c.k;
                return (
                  <div key={c.k} className={c.largura || (c.bloco ? 'c6' : 'c6')} style={{ display: 'grid', gap: 4, alignContent: 'start' }}>
                    <label htmlFor={id}><span>{c.rotulo}{c.obrigatorio ? ' *' : ''}</span></label>
                    {c.tipo === 'select' ? (
                      <select id={id} name={nome} defaultValue={cfg[c.k] || ''}><option value="">Selecione</option>{c.opcoes.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
                    ) : c.bloco ? (
                      <CampoBloco id={id} name={nome} salvo={seg[c.k]} />
                    ) : c.segredo ? (
                      <input id={id} name={nome} type="password" autoComplete="new-password" placeholder={seg[c.k] ? `Já salvo (${seg[c.k]}). Deixe em branco para manter.` : ''} />
                    ) : (
                      <input id={id} name={nome} defaultValue={cfg[c.k] || ''} placeholder={c.dica || ''} autoComplete="off" />
                    )}
                    {c.dica && c.tipo !== 'select' && c.segredo && <span className="sub">{c.dica}</span>}
                    {c.segredo && seg[c.k] && <label className="check"><input type="checkbox" name={'r_' + c.k} id={id + '-rm'} /><span className="sub">Remover o valor salvo</span></label>}
                  </div>
                );
              })}
            </div>
          </fieldset>
          <div className="linha" style={{ justifyContent: 'space-between' }}>
            <span className="sub" style={{ maxWidth: '70ch' }}>{!sit.completa ? `Falta: ${sit.faltam.join(', ')}. ` : ''}{def.usa}{linha.atualizado_por && Object.keys(cfg).length + Object.keys(seg).length > 0 ? ` Última alteração por ${linha.atualizado_por.replace('@gestao.sinergia360.com.br', '')}.` : ''}</span>
            {admin && <button className="btn">Salvar {def.nome}</button>}
          </div>
        </form>
      );
    })}
  </>);
}
