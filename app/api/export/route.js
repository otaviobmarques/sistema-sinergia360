import { createClient } from '@/lib/supabase/server';
import { carregarClientes, carregarTags, carregarVencimentos, carregarPendencias, CATEGORIAS, filtrarClientes, pendenciasDe } from '@/lib/dados';
import { SITUACOES, SERVICOS, TIPOS_PRAZO, ISO_SIT, EM_CARTEIRA, fmtDoc, fmtData, hojeISO } from '@/lib/format';

const cel = (v) => { const s = v == null ? '' : String(v); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const moeda = (v) => (v == null ? '' : Number(v).toFixed(2).replace('.', ','));

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Não autenticado', { status: 401 });
  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const tags = await carregarTags(supabase);
  const nomeTags = (c) => c.tagIds.map((t) => tags.find((x) => x.id === t)?.nome).join(', ');
  let cab, linhas;
  if (sp.rel === 'vencimentos') {
    const lista = await carregarVencimentos(supabase, sp);
    cab = ['Data', 'Prazo', 'Detalhe', 'Cliente', 'CNPJ/CPF', 'Tags', 'Cidade', 'UF', 'Contato', 'E-mail', 'Inadimplente'];
    linhas = lista.map((v) => [fmtData(v.data), TIPOS_PRAZO[v.tipo], v.detalhe, v.cliente.razao_social, fmtDoc(v.cliente.documento), nomeTags(v.cliente), v.cliente.cidade, v.cliente.uf, v.cliente.contato, v.cliente.email, v.cliente.inadimplente ? 'Sim' : '']);
  } else if (sp.rel === 'pendencias_cliente') {
    const { lista } = await carregarPendencias(supabase, sp);
    cab = ['Cliente', 'CNPJ/CPF', 'Tags', 'Cidade', 'UF', 'Contato', 'E-mail', 'Tipo', 'Pendência'];
    linhas = lista.flatMap(({ cliente: c, itens }) => itens.map((i) => [c.razao_social, fmtDoc(c.documento), nomeTags(c), c.cidade, c.uf, c.contato, c.email, CATEGORIAS[i.cat][0], i.texto]));
  } else {
    let lista = filtrarClientes(await carregarClientes(supabase), sp);
    if (sp.rel === 'pendencias') lista = lista.filter((c) => EM_CARTEIRA.includes(c.situacao) && pendenciasDe(c).length);
    if (sp.rel === 'encerrados') lista = lista.filter((c) => !['ativo', 'em_credenciamento'].includes(c.situacao));
    cab = ['CNPJ/CPF', 'Razão social', 'Tags', 'Situação', 'Inadimplente', 'Cidade', 'UF', 'Sócios', 'Contato', 'E-mail', 'Serviços', 'Valor mensal', 'Dia boleto', 'Último boleto', 'Assinatura', 'ISO emissão', 'ISO recertificação', 'ISO situação', 'Seguradora', 'Seguro vencimento', 'Encerramento', 'Motivo', 'Pendências'];
    linhas = lista.map((c) => [fmtDoc(c.documento), c.razao_social, nomeTags(c), SITUACOES[c.situacao], c.inadimplente ? 'Sim' : '', c.cidade, c.uf, c.socios, c.contato, c.email,
      SERVICOS.filter(([k]) => c[k]).map(([, n]) => n).join(', '), moeda(c.valor_mensal), c.dia_boleto, c.ultimo_boleto ? c.ultimo_boleto.slice(5, 7) + '/' + c.ultimo_boleto.slice(0, 4) : '',
      c.data_assinatura ? fmtData(c.data_assinatura) : '', c.iso?.data_emissao ? fmtData(c.iso.data_emissao) : '', c.iso?.data_recertificacao ? fmtData(c.iso.data_recertificacao) : '', c.iso ? ISO_SIT[c.iso.situacao] : '',
      c.apolice?.seguradora, c.apolice?.vencimento ? fmtData(c.apolice.vencimento) : '', c.data_encerramento ? fmtData(c.data_encerramento) : '', c.motivo_encerramento, pendenciasDe(c).join(', ')]);
  }
  // BOM + ponto e vírgula: abre direto no Excel em português com acentos corretos.
  const csv = '﻿' + [cab, ...linhas].map((l) => l.map(cel).join(';')).join('\r\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="sinergia360-${sp.rel || 'clientes'}-${hojeISO()}.csv"` } });
}
