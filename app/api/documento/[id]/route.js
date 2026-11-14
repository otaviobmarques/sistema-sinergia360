import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Abre o arquivo por um link temporário (5 minutos); o bucket é privado.
export async function GET(_req, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Não autenticado', { status: 401 });
  const { data: doc } = await supabase.from('documentos').select('arquivo_path, arquivo_nome').eq('id', (await params).id).maybeSingle();
  if (!doc) return new Response('Documento não encontrado', { status: 404 });
  const { data, error } = await supabase.storage.from('documentos').createSignedUrl(doc.arquivo_path, 300, { download: doc.arquivo_nome });
  if (error) return new Response('Não foi possível abrir o arquivo', { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
