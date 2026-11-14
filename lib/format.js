export const SITUACOES = {
  ativo: 'Ativo', em_credenciamento: 'Em credenciamento', paralisado: 'Paralisado',
  encerrando: 'Encerrando', encerrado: 'Encerrado',
};
export const SIT_CLASSE = { ativo: 'ok', em_credenciamento: 'neutro', paralisado: 'alerta', encerrando: 'alerta', encerrado: 'ruim' };
export const EM_CARTEIRA = ['ativo', 'em_credenciamento', 'encerrando'];
export const ISO_SIT = {
  aguardando_credenciamento: 'Aguardando credenciamento', em_emissao: 'Em emissão', vigente: 'Vigente',
  suspensa: 'Suspensa', vencida: 'Vencida',
};
export const TIPOS_PRAZO = {
  iso_manutencao_1: 'ISO · 1ª manutenção', iso_manutencao_2: 'ISO · 2ª manutenção',
  iso_recertificacao: 'ISO · recertificação', auditoria_interna: 'Auditoria interna',
  recredenciamento: 'Recredenciamento', seguro: 'Seguro RCP', outro: 'Outro',
};
export const SERVICOS = [
  ['serv_iso', 'ISO 9001'], ['serv_seguro', 'Seguro RCP'], ['serv_ouvidoria', 'Ouvidoria'],
  ['serv_auditoria', 'Auditoria interna (SGQ)'], ['serv_credenciamento', 'Credenciamento'], ['serv_consultoria', 'Consultoria'],
];
export const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// Datas trafegam como 'AAAA-MM-DD' e são tratadas sem fuso para não deslocar o dia.
export const hojeISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
export const fmtData = (d) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '—');
export const fmtMes = (d) => (d ? `${MESES[+d.slice(5, 7) - 1]}/${d.slice(0, 4)}` : '—');
export const fmtMoeda = (v) => (v == null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
export const fmtMil = (v) => (v >= 1000 ? `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : fmtMoeda(v));
export const soDigitos = (s) => String(s || '').replace(/\D/g, '');
export function fmtDoc(d) {
  d = soDigitos(d);
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  return d || '—';
}
export function addMeses(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const alvo = new Date(Date.UTC(y, m - 1 + n, 1));
  const ultimo = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, ultimo));
  return alvo.toISOString().slice(0, 10);
}
export const addDias = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
export const diasAte = (iso, hoje = hojeISO()) => Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse(hoje + 'T00:00:00Z')) / 864e5);
export function faixa(iso, hoje) {
  const d = diasAte(iso, hoje);
  if (d < 0) return { rotulo: `Vencido há ${-d} d`, classe: 'ruim', chave: 'vencido' };
  if (d <= 30) return { rotulo: d === 0 ? 'Vence hoje' : `${d} dias`, classe: 'alerta', chave: '30' };
  if (d <= 60) return { rotulo: `${d} dias`, classe: 'alerta', chave: '60' };
  if (d <= 90) return { rotulo: `${d} dias`, classe: 'neutro', chave: '90' };
  return { rotulo: `${d} dias`, classe: 'ok', chave: 'depois' };
}
// Ciclo da ISO 9001: manutenções em 12 e 24 meses, recertificação em 36, auditoria interna anual.
export function prazosIso(emissao, recertificacao) {
  const fim = recertificacao || addMeses(emissao, 36);
  return [
    { tipo: 'auditoria_interna', data_prevista: addMeses(emissao, 12) },
    { tipo: 'iso_manutencao_1', data_prevista: addMeses(emissao, 12) },
    { tipo: 'auditoria_interna', data_prevista: addMeses(emissao, 24) },
    { tipo: 'iso_manutencao_2', data_prevista: addMeses(emissao, 24) },
    { tipo: 'auditoria_interna', data_prevista: fim },
    { tipo: 'iso_recertificacao', data_prevista: fim },
  ];
}
export const TIPOS_DOC = {
  apolice_seguro: 'Apólice de seguro', certificado_iso: 'Certificado ISO', manual_qualidade: 'Manual da qualidade (SGQ)',
  relatorio_auditoria: 'Relatório de auditoria', contrato: 'Contrato', portaria_credenciamento: 'Portaria de credenciamento', outro: 'Outro',
};
export const fmtTamanho = (b) => (b == null ? '' : b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`);
