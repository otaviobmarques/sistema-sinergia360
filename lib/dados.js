import { EM_CARTEIRA, hojeISO, addDias, soDigitos, TIPOS_PRAZO, TIPOS_DOC, MESES } from './format';

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


export const CATEGORIAS = {
  vencido: ['Prazo vencido', 'ruim'], vencendo: ['Vence em 30 dias', 'alerta'], financeiro: ['Financeiro', 'ruim'],
  documento: ['Documento', 'alerta'],
  iso: ['ISO', 'ruim'], cadastro: ['Cadastro incompleto', 'neutro'],
};

// Tudo que cada cliente em carteira tem para resolver: prazos, financeiro, ISO e cadastro.
export async function carregarPendencias(supabase, { tag = '', cat = '', q = '' } = {}) {
  const [clientes, venc, docs] = await Promise.all([carregarClientes(supabase), carregarVencimentos(supabase, { periodo: '30' }), carregarDocumentos(supabase)]);
  const hoje = hojeISO(), mes = hoje.slice(0, 8) + '01';
  const porCliente = new Map();
  for (const v of venc) (porCliente.get(v.cliente_id) || porCliente.set(v.cliente_id, []).get(v.cliente_id)).push(v);
  const data = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
  const linhas = filtrarClientes(clientes, { tag, q })
    .filter((c) => EM_CARTEIRA.includes(c.situacao))
    .map((c) => {
      const itens = [];
      for (const v of porCliente.get(c.id) || []) {
        const nome = TIPOS_PRAZO[v.tipo] + (v.detalhe ? ` (${v.detalhe})` : '');
        itens.push(v.data < hoje ? { cat: 'vencido', texto: `${nome} vencido em ${data(v.data)}`, data: v.data } : { cat: 'vencendo', texto: `${nome} vence em ${data(v.data)}`, data: v.data });
      }
      for (const d of docs.filter((d) => d.cliente_id === c.id && d.vigente && d.data_vencimento && d.data_vencimento <= addDias(hoje, 30))) {
        itens.push({ cat: 'documento', texto: `${TIPOS_DOC[d.tipo]} ${d.data_vencimento < hoje ? 'vencido' : 'vence'} em ${data(d.data_vencimento)}` });
      }
      if (c.inadimplente) itens.push({ cat: 'financeiro', texto: 'Inadimplente' });
      if (c.situacao !== 'em_credenciamento' && c.valor_mensal != null && (!c.ultimo_boleto || c.ultimo_boleto < mes)) itens.push({ cat: 'financeiro', texto: `Boleto de ${MESES[+mes.slice(5, 7) - 1]} não emitido` });
      if (c.iso?.situacao === 'suspensa') itens.push({ cat: 'iso', texto: 'ISO suspensa' });
      if (c.iso?.situacao === 'em_emissao') itens.push({ cat: 'iso', texto: 'ISO em emissão' });
      if (c.situacao_receita && c.situacao_receita !== 'ATIVA') itens.push({ cat: 'cadastro', texto: `CNPJ ${c.situacao_receita.toLowerCase()} na Receita` });
      for (const p of pendenciasDe(c)) itens.push({ cat: 'cadastro', texto: p });
      return { cliente: c, itens };
    });
  const totais = Object.fromEntries(Object.keys(CATEGORIAS).map((k) => [k, linhas.filter((l) => l.itens.some((i) => i.cat === k)).length]));
  const peso = { vencido: 100, financeiro: 30, iso: 30, documento: 20, vencendo: 10, cadastro: 1 };
  const lista = linhas
    .map((l) => ({ ...l, itens: cat ? l.itens.filter((i) => i.cat === cat) : l.itens }))
    .filter((l) => l.itens.length)
    .sort((a, b) => b.itens.reduce((s, i) => s + peso[i.cat], 0) - a.itens.reduce((s, i) => s + peso[i.cat], 0) || a.cliente.razao_social.localeCompare(b.cliente.razao_social));
  return { lista, totais, comPendencia: linhas.filter((l) => l.itens.length).length, emCarteira: linhas.length };
}

// Documentos que o contrato do cliente exige e ainda não têm arquivo vigente.
export function documentosFaltando(c, docs) {
  const tem = (t) => docs.some((d) => d.vigente && d.tipo === t);
  const f = [];
  if (c.serv_seguro && !tem('apolice_seguro')) f.push('apolice_seguro');
  if (c.serv_iso && c.iso?.data_emissao && !tem('certificado_iso')) f.push('certificado_iso');
  if (c.serv_auditoria && !tem('manual_qualidade')) f.push('manual_qualidade');
  return f;
}
export async function carregarDocumentos(supabase) {
  const { data, error } = await supabase.from('documentos').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}
