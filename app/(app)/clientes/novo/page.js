import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { carregarTags } from '@/lib/dados';
import ClienteForm from '@/components/ClienteForm';

export default async function Novo() {
  const tags = await carregarTags(await createClient());
  return (<>
    <div className="topo"><div><div className="eyebrow"><Link href="/clientes">Clientes</Link> · novo</div><h1>Novo cliente</h1>
      <p>Digite o CNPJ e use "Buscar na Receita" para preencher razão social, endereço e sócios.</p></div></div>
    <ClienteForm tags={tags} />
  </>);
}
