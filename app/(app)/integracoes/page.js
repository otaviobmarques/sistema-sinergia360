// Vitrine das integrações do sistema. Cada uma passa a "Conectada" quando suas credenciais forem configuradas.
const INTEGRACOES = [
  {
    nome: 'Inteligência artificial', resumo: 'Um assistente dentro do sistema para ler documentos e redigir mensagens.',
    faz: ['Ler apólices e certificados enviados e sugerir a data de vencimento', 'Redigir avisos de vencimento e mensagens de cobrança para o cliente', 'Resumir as pendências de um cliente ou de uma franquia'],
    precisa: ['Chave de API do provedor de IA', 'Definir quais tarefas a IA pode executar sozinha e quais só sugere'],
  },
  {
    nome: 'Banco Cora', resumo: 'Emissão e acompanhamento dos boletos mensais direto pelo sistema.',
    faz: ['Emitir os boletos do mês a partir do valor e do dia de vencimento de cada contrato', 'Dar baixa automática quando o boleto for pago', 'Marcar inadimplência e disparar a cobrança de quem está em atraso'],
    precisa: ['Credenciais de API da conta PJ da Sinergia 360 no Cora', 'Regra de cobrança: multa, juros e em quantos dias o cliente vira inadimplente'],
  },
  {
    nome: 'Google Drive', resumo: 'Cópia organizada dos arquivos de cada cliente, com data de vencimento.',
    faz: ['Criar uma pasta por cliente e guardar apólice de seguro, certificado da ISO, manual da qualidade (SGQ) e outros documentos', 'Mostrar os arquivos na ficha do cliente, cada um com tipo e data de vencimento', 'Avisar em Pendências quando um documento vencer ou estiver faltando'],
    precisa: ['Conta Google da Sinergia 360 que será dona das pastas', 'Pasta raiz no Drive onde os clientes serão organizados'],
  },
];

export default function Integracoes() {
  return (<>
    <div className="topo"><div><div className="eyebrow">Integrações</div><h1>Conexões do sistema com outros serviços</h1>
      <p>Nenhuma integração está conectada ainda. Abaixo está o que cada uma vai fazer e o que falta para ligar.</p></div></div>
    <div className="grid g3">
      {INTEGRACOES.map((i) => (
        <div key={i.nome} className="painel t" style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
          <div className="linha" style={{ justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>{i.nome}</h2><span className="pill">Não conectada</span></div>
          <p style={{ margin: 0, color: 'var(--ink2)' }}>{i.resumo}</p>
          <div><div className="rotulo">O que vai fazer</div><ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{i.faz.map((f) => <li key={f} style={{ margin: '4px 0' }}>{f}</li>)}</ul></div>
          <div><div className="rotulo">O que falta para conectar</div><ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{i.precisa.map((f) => <li key={f} style={{ margin: '4px 0' }}>{f}</li>)}</ul></div>
        </div>
      ))}
    </div>
  </>);
}
