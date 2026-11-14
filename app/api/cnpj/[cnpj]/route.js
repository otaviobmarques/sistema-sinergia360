import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Consulta o cadastro público da Receita (via BrasilAPI) para preencher o formulário de cliente.
export async function GET(_req, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });
  const cnpj = (await params).cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14) return NextResponse.json({ erro: 'CNPJ deve ter 14 dígitos.' }, { status: 400 });
  const indisponivel = NextResponse.json({ erro: 'Consulta à Receita indisponível. Preencha manualmente.' }, { status: 502 });
  let r;
  try { r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, { cache: 'no-store' }); } catch { r = null; }
  if (r && (r.status === 404 || r.status === 400)) return NextResponse.json({ erro: 'CNPJ não encontrado na Receita.' }, { status: 404 });
  if (!r || !r.ok) {
    // Segunda fonte pública, caso a primeira esteja fora do ar ou limitando consultas.
    let r2;
    try { r2 = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, { cache: 'no-store' }); } catch { return indisponivel; }
    if (r2.status === 404) return NextResponse.json({ erro: 'CNPJ não encontrado na Receita.' }, { status: 404 });
    if (!r2.ok) return indisponivel;
    const k = await r2.json(), e = k.estabelecimento || {};
    return NextResponse.json({
      razao_social: k.razao_social || '', nome_fantasia: e.nome_fantasia || '',
      cidade: e.cidade?.nome || '', uf: e.estado?.sigla || '', bairro: e.bairro || '',
      logradouro: [e.tipo_logradouro, e.logradouro].filter(Boolean).join(' '),
      numero: e.numero || '', complemento: e.complemento || '', cep: e.cep || '',
      situacao_receita: (e.situacao_cadastral || '').toUpperCase(), email: (e.email || '').toLowerCase(),
      contato: e.ddd1 && e.telefone1 ? `${e.ddd1} ${e.telefone1}` : '',
      socios: (k.socios || []).map((s) => s.nome).filter(Boolean).join(', '),
    });
  }
  const j = await r.json();
  const fone = (j.ddd_telefone_1 || '').replace(/\D/g, '');
  return NextResponse.json({
    razao_social: j.razao_social || '', nome_fantasia: j.nome_fantasia || '',
    cidade: j.municipio || '', uf: j.uf || '', bairro: j.bairro || '',
    logradouro: [j.descricao_tipo_de_logradouro, j.logradouro].filter(Boolean).join(' '),
    numero: j.numero || '', complemento: j.complemento || '', cep: j.cep || '',
    situacao_receita: j.descricao_situacao_cadastral || '',
    email: (j.email || '').toLowerCase(),
    contato: fone ? `${fone.slice(0, 2)} ${fone.slice(2)}` : '',
    socios: (j.qsa || []).map((s) => s.nome_socio).filter(Boolean).join(', '),
  });
}
