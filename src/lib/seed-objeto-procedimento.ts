import { supabase } from "@/integrations/supabase/client";

const PROCEDIMENTOS = [
  "Ação de Cobrança", "Ação Declaratória de Inexistência de Débito", "Ação Declaratória", "Ação Monitória", "Ação Rescisória",
  "Acidente de Trabalho", "Imóvel", "Execução Fiscal - Multa Administrativa/Ressarcimento ao SUS", "Questões Administrativas - Dispensa Membro Conselho",
  "Acúmulo de Função", "Adaptação/ migração", "Adicional Noturno", "Admissão Médico Cooperado", "Alienação Compulsória de Carteira",
  "Anulação / Revisão de Lançamento Tributário", "Anulação de Lançamento Ressarcimento SUS", "Anulação de Multa Administrativa",
  "Anulação de Partilha", "Anulatória", "Assédio Moral", "Autorização Registro de Farmácia", "Execução Fiscal - Multa ANS",
  "Execução Fiscal - Ressarcimento ao SUS", "Declaração de Receita", "Alteração Rede Credenciada", "Atualização Cadastral",
  "Ausência de Prestador", "Autorização Diversa da solicitação médica", "Autorização Judicial", "Call Center", "Carta Precatória",
  "Cirurgia Bariátrica - sem cobertura contratual", "Cirurgia Bariátrica - sem DUT", "Cirurgias Plásticas Pós Bariátrica",
  "Cláusula Número Mínimo de Vidas no Plano", "Cobertura Parcial Temporária - CPT", "Cobrança", "Consignação em Pagamento",
  "Continuidade Aposentado - Art.31 Lei 9.656/98", "Continuidade Demitido - Art.30 Lei 9.656/98", "Contrato", "Contrato Bancário",
  "Contrato de Credenciamento", "Contribuição Previdenciária", "Cooperado/Ex-cooperados", "Coparticipação", "Coparticipação em Psiquiatria",
  "Credenciamento", "Cumprimento de Sentença", "Curativo à Vácuo", "Dano Estético", "Dano Material", "Dano Moral",
  "Demora autorização - Intercâmbio", "Demora autorização - RN nº 259", "Demora no atendimento", "Descredenciamento hospital/clínica",
  "Descumprimento Estatuto/ Regimento da Cooperativa", "Desligamento de Cooperado", "Desvio de Função", "Direito Administrativo",
  "Dispensa Discriminatória", "Embargos à Execução Fiscal", "Envio de informação/documento", "Equiparação Salarial",
  "Exclusão de Beneficiário", "Execução Astreinte", "Execução de Alimentos", "Execução Fiscal", "Execução Título Extrajudicial",
  "Exibição de Documento", "Férias", "Higiene do Hospital", "Home Care", "Homologação de Acordo", "Horas Extras",
  "Hospital de Alto Custo", "Impedir Contratação", "Impugnação", "Inclusão de Recém-Nascido", "Indenização por Morte",
  "Indisponibilidade de Telefone", "INSS", "Intervalo intrajornada", "Inventário", "ISS", "Lucros Cessantes",
  "Manutenção de Credenciamento", "Medicamento de Uso Domiciliar fora Rol", "Medicamento Importado não Nacionalizado",
  "Medicamento Off Label", "Multa ANS", "Negativa de Procedimento - fora da área de abrangência",
  "Negativa de Procedimento - Rede Não Credenciada", "Negativa de transporte Aeromédico", "Negativa de transporte terrestre",
  "Negativa OPME - Importado com similar nacional", "Negativa OPME - sem cobertura contrato antigo",
  "Negativa por Carência Contratual", "Negativa por Divergência Médica", "Negativa por Limite Máximo de Sessões",
  "Negativa por prestador fora da Rede Credenciada", "Negativa Procedimento - não consta no Rol da ANS",
  "Negativa Procedimento - não preenche DUT", "Negativa Procedimento - sem cobertura contrato antigo",
  "Negativa Terapias -Therasuit, Equoterapia, etc.", "Negativação Indevida - SPC/SERASA", "Obrigação de Fazer",
  "Pagamento Extrafolha", "Pedido Informações", "Portabilidade", "Produção de Prova", "Radio e quimioterapia",
  "Reajuste anual - plano individual", "Reajuste de Mensalidade por Faixa Etária", "Reajuste de Mensalidade por Sinistralidade",
  "Reativação de contrato", "Recuperação Judicial", "Reembolso", "Reintegração de Posse", "Repetição de Indébito Tributário",
  "Rescisão Contrato Coletivo - Inadimplência", "Rescisão Contrato Individual - Inadimplência", "Rescisão Indireta",
  "Ressarcimento ao SUS", "Revlimid", "Stent", "Sustação de Protesto", "Synvisc", "Taxa de Saúde Suplementar",
  "Terceirização de Trabalho", "Tomografia de Coerência Óptica", "Usucapião", "Verbas Rescisórias", "Vício no Produto",
  "Vício Oculto no Produto", "Vinculo Trabalhista", "Falha de Atendimento", "Urgência/ Emergência", "Inclusão em Plano Coletivo",
  "Medicamento negado - sem DUT", "Cancelamento de contrato pelo beneficiário", "Reclamatória Trabalhista", "Reversão Demissão",
  "Tutela Cautelar Antecedente", "Dano Existencial", "Cobrança Indevida", "Exoneração de Alimentos",
  "Reajuste Anual - Contrato Coletivo", "Adicional de Insalubridade", "Fraude na Celebração do Contrato", "Divórcio Consensual",
  "Divórcio Litigioso", "Locação de Imóvel", "Habilitação de crédito (falência/rec. judicial)", "Falência/Rec. judicial",
  "Protesto", "Manutenção no Plano", "Mineração", "Reconhecimento/Dissolução União Estável", "Prestação de Contas",
  "Imposto de Renda", "Falha na Ativação do Contrato", "Negativa de Material", "Fertilização In Vitro",
  "Responsabilidade Civil - Furto", "Negativa Internação - Urgência e Emergência", "Garantia de Atendimento", "Carência",
  "Contrato Declinado", "Reajuste", "Portal Beneficiário", "Rescisão Unilateral do Contrato", "Mandado de Segurança",
  "Notificação Extrajudicial", "Reintegração", "Inclusão/Reinclusão de Dependente",
  "Negativa de Tratamento - Uso de Medicamento Off Label", "Atendimento Domiciliar", "Negativa de Internação", "Duplicata",
  "Negativa Procedimento - Ausência Cobertura Contratual", "Consultivo", "Ofício Trabalhista", "Home Care (Internação)",
  "Home Care (Atendimento)", "Cirurgia Bariátrica - CPT", "Fornecimento de Medicamento", "Desconto Assistencial",
  "Reajuste Mensalidade Dependente Especial", "Conversão Dispensa por Justa Causa", "Anulação/Revisão de Multa ou Tributo",
  "Cobrança Serviços Médicos", "Ressarcimento", "Progressão de Carreira", "Envio de Carteira do Plano de Saúde",
  "Falha na Prestação de Serviços", "Pensão por Morte", "Perdas e Danos", "Destituição do Poder Familiar", "Guarda", "Adoção",
  "Pensão", "Demora Autorização Exame/Procedimento", "Negativa de Seguro",
  "Reconhecimento de Grupo Econômico/Quotas Societárias", "IRRF - Remuneração Serviços Prestados Cooperativa", "Testamento",
  "Arresto", "Transferência de Segurado - Novo Plano", "Multa por Denúncia Antecipada",
  "Negativa de Procedimento - Doença/Lesão Pré-existente", "Suspensão do Plano", "Acidente de Trânsito",
  "Cumprimento de Oferta", "Curatela/Interdição", "Contribuições Corporativas", "Habilitação de Crédito (Inventário)",
  "Transferência de Hospital", "Redirecionamento de Prestador", "Ação de Regresso", "Cobrança Indevida ICMS", "FGTS",
  "Discriminação/Constrangimento", "Despejo", "Adicional de Periculosidade", "Doença Ocupacional", "Multas Convencionais",
  "Apuração de Falta Grave", "Multa por Rescisão Contratual", "Habilitação", "Embargos de Terceiro",
  "Responsabilidade Civil - Diretores Técnicos", "Contratos Administrativos", "Inquérito Civil", "Inexigibilidade do Débito",
  "Suspensão do Plano por Inadimplência", "Administradora de Benefícios – Cancelamento Indevido",
  "Administradora de Benefícios – Cancelamento/Suspensão do Plano por Inadimplência",
  "Administradora de Benefícios – Inscrição Indevida", "Administradora de Benefícios – Movimentação Cadastral Indevida",
  "Administradora de Benefícios – Reajuste Anual", "Administradora de Benefícios – Reajustes Faixa Etária",
  "Anulação de Multa Administrativa - ANS", "Atendimento Fora da Rede Própria ou Credenciada",
  "Carência Contratual – Eletivo", "Carência Contratual – Urgência/Emergência",
  "Cobertura Parcial Temporária – Preexistência",
  "Continuidade de Plano de Saúde - Aposentados - Artigo 31 da Lei Nº. 9.656/98",
  "Continuidade de Plano de Saúde - Demitidos - Artigo 30 da Lei Nº. 9.656/98", "Dívida com Prestadores em Geral",
  "Dívida com Terceiros – Aeronáutica", "DUT - Diretrizes de Utilização", "Erro Médico",
  "Erro Médico – Incapacidade Permanente", "Erro Médico – Óbito", "Erro na Venda",
  "Exclusão Contratual – Abrangência Geográfica", "Exclusão Contratual – Plano Não Regulamentado",
  "Exclusão Contratual – Segmentação do Plano", "Exclusão Legal - Artigo 10 da Lei n° 9.656/98 – Inseminação Artificial",
  "Exclusão Legal - Artigo 10 da Lei Nº. 9.656/98 - Medicamento Não Nacionalizado",
  "Exclusão Legal - Artigo 10 da Lei n° 9.656/98 - Medicamento para Tratamento Domiciliar",
  "Exclusão Legal - Artigo 10 da Lei n° 9.656/98 - Procedimento Estético",
  "Exclusão Legal - Artigo 10 da Lei n° 9.656/98 - Procedimento Experimental",
  "Exclusão Legal - Artigo 10 da Lei n° 9.656/98 – Próteses e Órteses não ligadas ao Ato Cirúrgico",
  "Exclusão Legal - Home Care", "Execução de Multa por Descumprimento",
  "Falha na Prestação Do Serviço - Questões Administrativas", "Falha na Prestação Do Serviço - Questões Assistenciais",
  "Falta De Prestador Credenciado / Prazo Atendimento Ans", "Identificação Biométrica", "Repactuação de dívidas",
  "Inscrição Indevida Do Débito – Pessoa Física", "Inscrição Indevida Do Débito – Pessoa Jurídica",
  "Mecanismo De Regulação - Contraindicação Médica", "Mecanismo De Regulação – Franquia",
  "Mecanismo De Regulação - Internação Psiquiátrica Superior A 30 Dias",
  "Plano Coletivo –  Movimentação Cadastral Indevida", "Plano Coletivo - Cancelamento Indevido",
  "Plano Coletivo - Cancelamento/Suspensão por Inadimplência", "Plano Coletivo – Reajuste Anual",
  "Plano Coletivo – Reajuste por Faixa Etária", "Plano Individual/Familiar - Cancelamento/Suspensão por Inadimplência",
  "Plano Individual/Familiar – Movimentação Cadastral Indevida", "Plano Individual/Familiar – Reajuste Anual",
  "Plano Individual/Familiar – Reajuste por Faixa Etária", "Rede Credenciada de Terceiros",
  "Rol de Procedimentos e Eventos em Saúde", "Regularização de Empresa", "Descanso Semanal",
  "Composição do Quadro SESMT", "Descumprimento NR-4", "Descumprimento Cota - PCD", "Discussão Societária"
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function seedObjetoProcedimento() {
  try {
    // Buscar o option_set_id
    const { data: optionSet, error: setError } = await supabase
      .from('option_sets')
      .select('id')
      .eq('key', 'objeto-procedimento')
      .single();

    if (setError || !optionSet) {
      console.error('Erro ao buscar option_set:', setError);
      return false;
    }

    // Verificar se já existem itens
    const { count } = await supabase
      .from('option_items')
      .select('*', { count: 'exact', head: true })
      .eq('option_set_id', optionSet.id);

    if (count && count > 0) {
      console.log('Já existem itens cadastrados');
      return true;
    }

    // Inserir todos os procedimentos em lotes
    const batchSize = 50;
    for (let i = 0; i < PROCEDIMENTOS.length; i += batchSize) {
      const batch = PROCEDIMENTOS.slice(i, i + batchSize);
      const items = batch.map((label, index) => ({
        option_set_id: optionSet.id,
        label,
        value: slugify(label),
        order: i + index + 1,
        is_active: true,
        is_default: false
      }));

      const { error: insertError } = await supabase
        .from('option_items')
        .insert(items);

      if (insertError) {
        console.error('Erro ao inserir lote:', insertError);
        return false;
      }
    }

    console.log(`✅ ${PROCEDIMENTOS.length} procedimentos inseridos com sucesso!`);
    return true;
  } catch (error) {
    console.error('Erro ao popular dados:', error);
    return false;
  }
}
