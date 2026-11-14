'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SERVICOS, soDigitos, prazosIso, hojeISO } from '@/lib/format';

const txt = (f, k) => { const v = (f.get(k) || '').toString().trim(); return v || null; };
const num = (f, k) => { const v = txt(f, k); return v == null ? null : Number(v.replace(/\./g, '').replace(',', '.')); };
function falhar(error) { if (error) throw new Error(error.message); }

export async function salvarCliente(formData) {
  const supabase = await createClient();
  const id = txt(formData, 'id');
  const doc = soDigitos(formData.get('documento'));
  const situacao = txt(formData, 'situacao') || 'ativo';
  const ultimo = txt(formData, 'ultimo_boleto');
  const dados = {
    tipo_doc: doc.length === 11 ? 'CPF' : 'CNPJ',
    documento: doc || null,
    razao_social: txt(formData, 'razao_social'),
    nome_fantasia: txt(formData, 'nome_fantasia'),
    cidade: txt(formData, 'cidade')?.toUpperCase() || null,
    uf: txt(formData, 'uf'), bairro: txt(formData, 'bairro'),
    logradouro: txt(formData, 'logradouro'), numero: txt(formData, 'numero'),
    complemento: txt(formData, 'complemento'), cep: txt(formData, 'cep'),
    situacao_receita: txt(formData, 'situacao_receita'),
    socios: txt(formData, 'socios'), contato: txt(formData, 'contato'), email: txt(formData, 'email')?.toLowerCase() || null,
    situacao, inadimplente: formData.get('inadimplente') === 'on',
    motivo_encerramento: txt(formData, 'motivo_encerramento'),
    data_encerramento: txt(formData, 'data_encerramento'),
    valor_mensal: num(formData, 'valor_mensal'),
    dia_boleto: num(formData, 'dia_boleto'),
    ultimo_boleto: ultimo ? `${ultimo}-01` : null,
    data_assinatura: txt(formData, 'data_assinatura'),
    observacoes: txt(formData, 'observacoes'),
  };
  for (const [k] of SERVICOS) dados[k] = formData.get(k) === 'on';
  if (!dados.razao_social) return { erro: 'Informe a razão social.' };

  let clienteId = id;
  if (id) {
    const { error } = await supabase.from('clientes').update(dados).eq('id', id);
    if (error) return { erro: mensagem(error) };
  } else {
    const { data, error } = await supabase.from('clientes').insert(dados).select('id').single();
    if (error) return { erro: mensagem(error) };
    clienteId = data.id;
  }
  const tags = formData.getAll('tags').map(Number);
  falhar((await supabase.from('cliente_tags').delete().eq('cliente_id', clienteId)).error);
  if (tags.length) falhar((await supabase.from('cliente_tags').insert(tags.map((tag_id) => ({ cliente_id: clienteId, tag_id })))).error);
  revalidatePath('/', 'layout');
  redirect(`/clientes/${clienteId}?salvo=1`);
}
const mensagem = (e) => (e.code === '23505' ? 'Já existe um cliente com este CNPJ/CPF.' : e.message);

export async function salvarIso(formData) {
  const supabase = await createClient();
  const cliente_id = txt(formData, 'cliente_id');
  const emissao = txt(formData, 'data_emissao');
  const recert = txt(formData, 'data_recertificacao');
  falhar((await supabase.from('iso_certificados').upsert({
    cliente_id, data_emissao: emissao, data_recertificacao: recert,
    situacao: txt(formData, 'situacao') || 'vigente',
    motivo_suspensao: txt(formData, 'motivo_suspensao'),
  }, { onConflict: 'cliente_id' })).error);
  if (emissao && formData.get('regerar') === 'on') {
    // Recria só os prazos ainda em aberto; o que já foi realizado fica no histórico.
    const tipos = ['iso_manutencao_1', 'iso_manutencao_2', 'iso_recertificacao', 'auditoria_interna'];
    falhar((await supabase.from('prazos').delete().eq('cliente_id', cliente_id).in('tipo', tipos).is('data_realizada', null)).error);
    const { data: feitos } = await supabase.from('prazos').select('tipo, data_prevista').eq('cliente_id', cliente_id).in('tipo', tipos);
    const ja = new Set((feitos || []).map((p) => p.tipo + p.data_prevista));
    const hoje = hojeISO();
    const novos = prazosIso(emissao, recert)
      .filter((p) => !ja.has(p.tipo + p.data_prevista))
      .filter((p) => p.data_prevista >= hoje || p.tipo === 'iso_recertificacao')
      .map((p) => ({ ...p, cliente_id }));
    if (novos.length) falhar((await supabase.from('prazos').insert(novos)).error);
  }
  revalidatePath('/', 'layout');
}

export async function addPrazo(formData) {
  const supabase = await createClient();
  falhar((await supabase.from('prazos').insert({
    cliente_id: txt(formData, 'cliente_id'), tipo: txt(formData, 'tipo'),
    data_prevista: txt(formData, 'data_prevista'), observacoes: txt(formData, 'observacoes'),
  })).error);
  revalidatePath('/', 'layout');
}
export async function concluirPrazo(formData) {
  const supabase = await createClient();
  falhar((await supabase.from('prazos').update({ data_realizada: txt(formData, 'data_realizada') || hojeISO() }).eq('id', txt(formData, 'id'))).error);
  revalidatePath('/', 'layout');
}
export async function reabrirPrazo(formData) {
  const supabase = await createClient();
  falhar((await supabase.from('prazos').update({ data_realizada: null }).eq('id', txt(formData, 'id'))).error);
  revalidatePath('/', 'layout');
}
export async function removerPrazo(formData) {
  const supabase = await createClient();
  falhar((await supabase.from('prazos').delete().eq('id', txt(formData, 'id'))).error);
  revalidatePath('/', 'layout');
}

// Uma apólice nova substitui a anterior, que fica no histórico como inativa.
export async function salvarApolice(formData) {
  const supabase = await createClient();
  const cliente_id = txt(formData, 'cliente_id');
  falhar((await supabase.from('apolices').update({ ativa: false }).eq('cliente_id', cliente_id).eq('ativa', true)).error);
  falhar((await supabase.from('apolices').insert({
    cliente_id, seguradora: txt(formData, 'seguradora')?.toUpperCase() || null, numero: txt(formData, 'numero'),
    inicio_vigencia: txt(formData, 'inicio_vigencia'), vencimento: txt(formData, 'vencimento'),
  })).error);
  revalidatePath('/', 'layout');
}
export async function removerApolice(formData) {
  const supabase = await createClient();
  falhar((await supabase.from('apolices').delete().eq('id', txt(formData, 'id'))).error);
  revalidatePath('/', 'layout');
}

export async function addAnotacao(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const texto = txt(formData, 'texto');
  if (!texto) return;
  falhar((await supabase.from('anotacoes').insert({ cliente_id: txt(formData, 'cliente_id'), texto, autor_email: user?.email })).error);
  revalidatePath('/', 'layout');
}

export async function marcarBoleto(formData) {
  const supabase = await createClient();
  falhar((await supabase.from('clientes').update({ ultimo_boleto: txt(formData, 'mes') }).eq('id', txt(formData, 'id'))).error);
  revalidatePath('/', 'layout');
}
export async function alternarInadimplente(formData) {
  const supabase = await createClient();
  falhar((await supabase.from('clientes').update({ inadimplente: formData.get('valor') === '1' }).eq('id', txt(formData, 'id'))).error);
  revalidatePath('/', 'layout');
}

export async function addTag(formData) {
  const supabase = await createClient();
  const nome = txt(formData, 'nome');
  if (nome) falhar((await supabase.from('tags').insert({ nome, tipo: txt(formData, 'tipo') || 'outro' })).error);
  revalidatePath('/', 'layout');
}
export async function removerTag(formData) {
  const supabase = await createClient();
  falhar((await supabase.from('tags').delete().eq('id', Number(formData.get('id')))).error);
  revalidatePath('/', 'layout');
}
export async function addConvite(formData) {
  const supabase = await createClient();
  const email = txt(formData, 'email')?.toLowerCase();
  if (email) falhar((await supabase.from('convites').upsert({ email, papel: txt(formData, 'papel') || 'operacao' })).error);
  revalidatePath('/configuracoes');
}
export async function removerConvite(formData) {
  const supabase = await createClient();
  const email = txt(formData, 'email');
  falhar((await supabase.from('convites').delete().eq('email', email)).error);
  falhar((await supabase.from('equipe').delete().eq('email', email)).error);
  revalidatePath('/configuracoes');
}
export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
