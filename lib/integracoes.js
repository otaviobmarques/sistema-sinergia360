// Campos de cada integração. "segredo: true" vai para o cofre e nunca volta para a tela.
export const INTEGRACOES = {
  ia: {
    nome: 'Inteligência artificial',
    resumo: 'Assistente para ler documentos enviados, sugerir datas de vencimento e redigir avisos e cobranças.',
    campos: [
      { k: 'provedor', rotulo: 'Provedor', tipo: 'select', opcoes: [['anthropic', 'Anthropic (Claude)'], ['openai', 'OpenAI (ChatGPT)'], ['google', 'Google (Gemini)']], obrigatorio: true },
      { k: 'modelo', rotulo: 'Modelo (opcional)', dica: 'Deixe em branco para usar o padrão do provedor.' },
      { k: 'api_key', rotulo: 'Chave de API', segredo: true, obrigatorio: true },
    ],
    usa: 'As funções de IA ainda não estão definidas; a chave fica guardada para quando forem ligadas.',
  },
  cora: {
    nome: 'Banco Cora',
    resumo: 'Emissão dos boletos mensais, baixa automática de pagamentos e cobrança de inadimplentes.',
    ajuda: 'No Cora Web ou no aplicativo: Conta › Integrações via APIs › Integração Direta. O Cora gera um Client ID, um certificado e uma chave privada. Exige o plano CoraPro. Teste e produção têm credenciais diferentes.',
    campos: [
      { k: 'ambiente', rotulo: 'Ambiente', tipo: 'select', opcoes: [['producao', 'Produção · matls-clients.api.cora.com.br'], ['stage', 'Teste (stage) · matls-clients.api.stage.cora.com.br']], obrigatorio: true },
      { k: 'client_id', rotulo: 'Client ID', dica: 'Ex.: int-xxxxxxxxxxxxxxxx', obrigatorio: true },
      { k: 'certificado', rotulo: 'Certificado (arquivo certificate.pem)', segredo: true, bloco: true, obrigatorio: true },
      { k: 'chave_privada', rotulo: 'Chave privada (arquivo private-key.key)', segredo: true, bloco: true, obrigatorio: true },
      { k: 'multa_percentual', rotulo: 'Multa por atraso (%)', dica: 'Ex.: 2', largura: 'c3' },
      { k: 'juros_mes', rotulo: 'Juros ao mês (%)', dica: 'Ex.: 1', largura: 'c3' },
      { k: 'dias_inadimplencia', rotulo: 'Dias de atraso para virar inadimplente', dica: 'Ex.: 10', largura: 'c6' },
    ],
    usa: 'A emissão de boletos entra com o módulo financeiro (fase 2).',
  },
  drive: {
    nome: 'Google Drive',
    resumo: 'Cópia organizada, numa pasta por cliente, dos arquivos enviados em Documentos.',
    ajuda: 'No Google Cloud Console: crie um projeto, ative a Google Drive API e crie uma credencial "ID do cliente OAuth" do tipo Aplicativo da Web. Em "URIs de redirecionamento autorizados" informe https://gestao.sinergia360.com.br/api/drive/retorno. Ela fornece o Client ID e o Client Secret.',
    campos: [
      { k: 'pasta_url', rotulo: 'Link da pasta raiz no Drive', obrigatorio: true },
      { k: 'client_id', rotulo: 'Client ID OAuth', dica: 'Termina em .apps.googleusercontent.com', obrigatorio: true },
      { k: 'client_secret', rotulo: 'Client Secret OAuth', segredo: true, obrigatorio: true },
    ],
    usa: 'Hoje os arquivos ficam guardados no próprio sistema. Com as credenciais salvas, o próximo passo é autorizar a conta Google uma vez; a partir daí cada documento enviado também é gravado nesta pasta, numa subpasta por cliente.',
  },
};

export function situacaoIntegracao(chave, linha) {
  const cfg = linha?.config || {}, seg = linha?.segredos || {};
  const faltam = INTEGRACOES[chave].campos.filter((c) => c.obrigatorio && !(c.segredo ? seg[c.k] : cfg[c.k])).map((c) => c.rotulo.replace(/ \(.*\)$/, ''));
  return { completa: faltam.length === 0, faltam };
}
