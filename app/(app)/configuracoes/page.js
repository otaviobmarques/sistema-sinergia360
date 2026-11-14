import { createClient } from '@/lib/supabase/server';
import { carregarTags } from '@/lib/dados';
import TrocarSenha from '@/components/TrocarSenha';
import EnviarLink from '@/components/EnviarLink';
import { addTag, removerTag, criarUsuario, editarUsuario, excluirUsuario } from '../actions';

const TIPOS = { franquia: 'Franquia', canal: 'Canal', servico: 'Serviço', grupo: 'Grupo de sócios', outro: 'Outro' };
const PAPEIS = { admin: 'Admin', administrativo: 'Administrativo' };
const login = (email) => email.replace('@gestao.sinergia360.com.br', '');

export default async function Administrativo({ searchParams }) {
  const { erro, ok } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [tags, { data: equipe }, { data: usos }] = await Promise.all([
    carregarTags(supabase), supabase.from('equipe').select('*').order('email'), supabase.from('cliente_tags').select('tag_id'),
  ]);
  const admin = equipe?.find((e) => e.user_id === user.id)?.papel === 'admin';
  const uso = (id) => (usos || []).filter((u) => u.tag_id === id).length;
  return (<>
    <div className="topo"><div><div className="eyebrow">Administrativo</div><h1>Usuários, tags e senha</h1></div></div>

    <div className="painel t" id="usuarios"><h2>Usuários do sistema</h2>
      {erro && <div className="aviso erro" role="alert" style={{ marginBottom: 12 }}>{erro}</div>}
      {ok && <div className="aviso" role="status" style={{ marginBottom: 12 }}>{ok}</div>}
      <div className="tabela" style={{ marginBottom: 16 }}><table>
        <thead><tr><th>Usuário</th><th>Nome</th><th>Perfil</th><th>Situação</th>{admin && <th>Ações</th>}</tr></thead>
        <tbody>{(equipe || []).map((u) => { const eu = u.user_id === user.id; return (
          <tr key={u.user_id}>
            <td>{login(u.email)}{eu && <span className="sub"> (você)</span>}</td><td>{u.nome || '—'}</td><td>{PAPEIS[u.papel]}</td>
            <td>{u.bloqueado ? <span className="pill ruim">Bloqueado</span> : <span className="pill ok">Ativo</span>}</td>
            {admin && <td>
              <div className="linha">
                <EnviarLink email={u.email} nome={u.nome} />
                {!eu && <form action={editarUsuario}>
                  <input type="hidden" name="id" value={u.user_id} /><input type="hidden" name="nome" value={u.nome || ''} /><input type="hidden" name="papel" value={u.papel} />
                  <input type="hidden" name="bloqueado" value={u.bloqueado ? '0' : '1'} /><button className="btn sec mini">{u.bloqueado ? 'Desbloquear' : 'Bloquear'}</button>
                </form>}
              </div>
              <details style={{ marginTop: 8 }}><summary className="rotulo" style={{ cursor: 'pointer' }}>Editar</summary>
                <form action={editarUsuario} className="filtros" style={{ marginTop: 8 }}>
                  <input type="hidden" name="id" value={u.user_id} /><input type="hidden" name="bloqueado" value={u.bloqueado ? '1' : '0'} />
                  <label><span>Nome</span><input id={'u-nome-' + u.user_id} name="nome" defaultValue={u.nome || ''} /></label>
                  <label><span>Perfil</span><select id={'u-papel-' + u.user_id} name="papel" defaultValue={u.papel}>{Object.entries(PAPEIS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
                  <label><span>Nova senha (opcional)</span><input id={'u-senha-' + u.user_id} name="senha" type="password" minLength={8} autoComplete="new-password" /></label>
                  <button className="btn mini">Salvar</button>
                </form>
              </details>
              {!eu && <details style={{ marginTop: 6 }}><summary className="rotulo" style={{ cursor: 'pointer' }}>Excluir</summary>
                <form action={excluirUsuario} className="linha" style={{ marginTop: 8 }}>
                  <input type="hidden" name="id" value={u.user_id} /><span className="sub">O acesso é removido e não pode ser desfeito.</span>
                  <button className="btn mini" style={{ background: 'var(--bad)', borderColor: 'var(--bad)' }}>Confirmar exclusão</button>
                </form>
              </details>}
            </td>}
          </tr>
        ); })}</tbody>
      </table></div>
      {admin ? <form action={criarUsuario} className="filtros">
        <label style={{ flex: '1 1 160px' }}><span>Nome</span><input id="nu-nome" name="nome" /></label>
        <label style={{ flex: '1 1 220px' }}><span>E-mail</span><input id="nu-email" name="email" type="email" required autoComplete="off" /></label>
        <label style={{ flex: '1 1 160px' }}><span>Senha (mín. 8)</span><input id="nu-senha" name="senha" type="password" minLength={8} required autoComplete="new-password" /></label>
        <label><span>Perfil</span><select id="nu-papel" name="papel" defaultValue="administrativo">{Object.entries(PAPEIS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
        <button className="btn">Cadastrar usuário</button>
      </form> : <p className="nota">Só usuários com perfil Admin cadastram, editam, bloqueiam ou excluem usuários.</p>}
    </div>

    <div className="grid g2">
      <div className="painel t"><h2>Tags</h2>
        <div className="tabela" style={{ marginBottom: 14 }}><table>
          <thead><tr><th>Tag</th><th>Tipo</th><th className="dir">Clientes</th><th></th></tr></thead>
          <tbody>{tags.map((t) => (
            <tr key={t.id}><td><span className="pill ok">{t.nome}</span></td><td>{TIPOS[t.tipo]}</td><td className="dir num">{uso(t.id)}</td>
              <td>{uso(t.id) === 0 && <form action={removerTag}><input type="hidden" name="id" value={t.id} /><button className="btn sec mini">Excluir</button></form>}</td></tr>
          ))}</tbody>
        </table></div>
        <form action={addTag} className="filtros">
          <label style={{ flex: '1 1 160px' }}><span>Nova tag</span><input id="tag-nome" name="nome" required /></label>
          <label><span>Tipo</span><select id="tag-tipo" name="tipo">{Object.entries(TIPOS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
          <button className="btn">Criar</button>
        </form>
      </div>
      <div className="painel t"><h2>Trocar minha senha</h2><TrocarSenha /></div>
    </div>
  </>);
}
