import { EM_CARTEIRA, hojeISO, addDias, soDigitos } from './format';

export async function carregarTags(supabase) {
  const { data } = await supabase.from('tags').select('*').order('tipo').order('nome');
  return data || [];
}

export async function carregarClientes(supabase) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*, cliente_tags(tag_id), iso_certificados(data_emissao, data_recertificacao, situacao), apolices(seguradora, vencimento, ativa)')
    .order('razao_social');
  if (error) throw new Error(error.message);
  return (data || []).map((c) => ({
    ...c,
    tagIds: c.cliente_tags.map((t) => t.tag_id),
    iso: Array.isArray(c.iso_certificados) ? c.iso_certificados[0] : c.iso_certificados,
    apolice: (c.apolices || []).filter((a) => a.ativa).sort((a, b) => (b.vencimento || '').localeCompare(a.vencimento || ''))[0],
  }));
}

// Vencimentos em aberto de clientes em carteira, já com o cliente junto.
export async function carregarVencimentos(supabase, { tipo = '', periodo = '90', tag = '' } = {}) {
  const [clientes, { data: venc, error }] = await Promise.all([
    carregarClientes(supabase),
    supabase.from('vencimentos').select('*').is('data_realizada', null).order('data'),
  ]);
  if (error) throw new Error(error.message);
  const porId = new Map(clientes.map((c) => [c.id, c]));
  const hoje = hojeISO();
  const limite = periodo === 'todos' || periodo === 'vencidos' ? null : addDias(hoje, Number(periodo));
  return (venc || [])
    .map((v) => ({ ...v, cliente: porId.get(v.cliente_id) }))
    .filter((v) => v.cliente && EM_CARTEIRA.includes(v.cliente.situacao))
    .filter((v) => !tag || v.cliente.tagIds.includes(Number(tag)))
    .filter((v) => !tipo || (tipo === 'iso' ? v.tipo.startsWith('iso_') : v.tipo === tipo))
    .filter((v) => (periodo === 'vencidos' ? v.data < hoje : limite ? v.data <= limite : true));
}

export function pendenciasDe(c) {
  const p = [];
  if (!c.uf) p.push('UF não informada');
  if (!c.email) p.push('E-mail não informado');
  if (c.serv_seguro && !c.apolice) p.push('Seguro contratado sem apólice');
  if (c.serv_iso && c.situacao !== 'em_credenciamento' && !c.iso?.data_emissao) p.push('ISO contratada sem data de emissão');
  if (c.valor_mensal == null) p.push('Valor mensal não informado');
  if (!c.dia_boleto) p.push('Dia do boleto não informado');
  if (!c.data_assinatura) p.push('Data de assinatura não informada');
  return p;
}

export function filtrarClientes(clientes, { q = '', tag = '', situacao = '', uf = '', servico = '', inad = '', iso = '' }) {
  const termo = q.trim().toLowerCase(), dig = soDigitos(q);
  return clientes.filter((c) =>
    (!termo || [c.razao_social, c.nome_fantasia, c.cidade, c.socios, c.email].some((x) => (x || '').toLowerCase().includes(termo)) || (dig.length >= 3 && (c.documento || '').includes(dig))) &&
    (!tag || c.tagIds.includes(Number(tag))) &&
    (!situacao || c.situacao === situacao) && (!uf || c.uf === uf) &&
    (!servico || c[servico]) && (!inad || c.inadimplente) && (!iso || c.iso?.situacao === iso));
}

