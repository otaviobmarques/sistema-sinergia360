import { createClient } from '@/lib/supabase/server';
import { carregarTags } from '@/lib/dados';
import { addTag, removerTag, addConvite, removerConvite } from '../actions';

const TIPOS = { franquia: 'Franquia', canal: 'Canal', servico: 'Serviço', grupo: 'Grupo de sócios', outro: 'Outro' };
const PAPEIS = { admin: 'Administrador', operacao: 'Operação', financeiro: 'Financeiro' };

export default async function Configuracoes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [tags, { data: equipe }, { data: convites }, { data: usos }] = await Promise.all([
    carregarTags(supabase), supabase.from('equipe').select('*').order('email'),
    supabase.from('convites').select('*').order('email'), supabase.from('cliente_tags').select('tag_id'),
  ]);
  const admin = equipe?.find((e) => e.user_id === user.id)?.papel === 'admin';
  const uso = (id) => (usos || []).filter((u) => u.tag_id === id).length;
  const ativos = new Set((equipe || []).map((e) => e.email.toLowerCase()));
  return (<>
    <div className="topo"><div><div className="eyebrow">Configurações</div><h1>Tags e equipe</h1></div></div>
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
      <div className="painel t"><h2>Equipe com acesso</h2>
        <div className="tabela" style={{ marginBottom: 14 }}><table>
          <thead><tr><th>E-mail</th><th>Perfil</th><th>Acesso</th><th></th></tr></thead>
          <tbody>{(convites || []).map((c) => (
            <tr key={c.email}><td>{c.email}</td><td>{PAPEIS[c.papel]}</td>
              <td>{ativos.has(c.email.toLowerCase()) ? <span className="pill ok">Ativo</span> : <span className="pill">Aguardando criar conta</span>}</td>
              <td>{admin && c.email.toLowerCase() !== user.email.toLowerCase() && <form action={removerConvite}><input type="hidden" name="email" value={c.email} /><button className="btn sec mini">Remover</button></form>}</td></tr>
          ))}{!(convites || []).length && <tr><td colSpan={4} className="vazio">{admin ? 'Nenhum e-mail liberado.' : 'Só administradores veem a lista.'}</td></tr>}</tbody>
        </table></div>
        {admin ? <form action={addConvite} className="filtros">
          <label style={{ flex: '1 1 200px' }}><span>Liberar e-mail</span><input id="cv-email" name="email" type="email" required /></label>
          <label><span>Perfil</span><select id="cv-papel" name="papel">{Object.entries(PAPEIS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
          <button className="btn">Liberar</button>
        </form> : <p className="nota">Só administradores liberam novos acessos.</p>}
        <p className="nota">A pessoa liberada cria a própria senha em "Primeiro acesso" na tela de entrada.</p>
      </div>
    </div>
  </>);
}
