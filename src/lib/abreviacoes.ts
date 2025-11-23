import { z } from 'zod';

// Palavras comuns que devem ser removidas ao gerar abreviações
const PALAVRAS_IGNORADAS = new Set([
  'ltda', 'sa', 's/a', 's.a', 's.a.', 'me', 'epp', 'eireli',
  'assistencia', 'assistência', 'medica', 'médica', 'saude', 'saúde',
  'servicos', 'serviços', 'comercio', 'comércio', 'industria', 'indústria',
  'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com',
  'plano', 'planos', 'cooperativa', 'unimed'
]);

// Schema de validação para abreviação
export const abreviacaoSchema = z.string()
  .trim()
  .min(2, { message: "Abreviação deve ter pelo menos 2 caracteres" })
  .max(10, { message: "Abreviação deve ter no máximo 10 caracteres" })
  .regex(/^[A-Z0-9]+$/, { message: "Abreviação deve conter apenas letras maiúsculas e números" });

/**
 * Remove acentos de uma string
 */
function removerAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Limpa o nome do cliente removendo palavras comuns
 */
function limparNomeCliente(nome: string): string[] {
  const palavras = removerAcentos(nome)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Remove caracteres especiais
    .split(/\s+/)
    .filter(palavra => palavra.length > 0 && !PALAVRAS_IGNORADAS.has(palavra.toLowerCase()));
  
  return palavras;
}

/**
 * Gera múltiplas sugestões de abreviação para um nome de cliente
 */
export function gerarSugestoesAbreviacao(nomeCliente: string): string[] {
  if (!nomeCliente || nomeCliente.trim().length === 0) {
    return [];
  }

  const sugestoes: Set<string> = new Set();
  const palavrasLimpas = limparNomeCliente(nomeCliente);

  if (palavrasLimpas.length === 0) {
    // Fallback: usar primeiras letras do nome original
    const nomeSimplificado = removerAcentos(nomeCliente)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    
    if (nomeSimplificado.length > 0) {
      sugestoes.add(nomeSimplificado.substring(0, 3));
    }
    return Array.from(sugestoes);
  }

  // Estratégia 1: Iniciais de todas as palavras principais (até 5 palavras)
  if (palavrasLimpas.length <= 5) {
    const iniciais = palavrasLimpas.map(p => p[0]).join('');
    if (iniciais.length >= 2 && iniciais.length <= 10) {
      sugestoes.add(iniciais);
    }
  }

  // Estratégia 2: Iniciais das 2-3 primeiras palavras
  if (palavrasLimpas.length >= 2) {
    const iniciais2 = palavrasLimpas.slice(0, 2).map(p => p[0]).join('');
    sugestoes.add(iniciais2);
  }
  
  if (palavrasLimpas.length >= 3) {
    const iniciais3 = palavrasLimpas.slice(0, 3).map(p => p[0]).join('');
    sugestoes.add(iniciais3);
  }

  // Estratégia 3: Primeiras 3-4 letras da primeira palavra
  const primeiraPalavra = palavrasLimpas[0];
  if (primeiraPalavra.length >= 3) {
    sugestoes.add(primeiraPalavra.substring(0, 3));
  }
  if (primeiraPalavra.length >= 4) {
    sugestoes.add(primeiraPalavra.substring(0, 4));
  }

  // Estratégia 4: Primeira palavra completa (se for curta)
  if (primeiraPalavra.length >= 2 && primeiraPalavra.length <= 6) {
    sugestoes.add(primeiraPalavra);
  }

  // Estratégia 5: Combinação primeira palavra + inicial da segunda
  if (palavrasLimpas.length >= 2 && primeiraPalavra.length <= 4) {
    sugestoes.add(primeiraPalavra + palavrasLimpas[1][0]);
  }

  // Estratégia 6: Para nomes com números, tentar preservá-los
  const numerosEncontrados = nomeCliente.match(/\d+/g);
  if (numerosEncontrados && palavrasLimpas.length > 0) {
    const base = palavrasLimpas[0].substring(0, 3);
    sugestoes.add(base + numerosEncontrados[0]);
  }

  // Filtrar sugestões válidas e ordenar por preferência
  const sugestoesValidas = Array.from(sugestoes)
    .filter(s => {
      try {
        abreviacaoSchema.parse(s);
        return true;
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      // Preferir sugestões com 3-4 caracteres
      const scorA = Math.abs(a.length - 3.5);
      const scorB = Math.abs(b.length - 3.5);
      return scorA - scorB;
    });

  // Retornar no máximo 5 sugestões
  return sugestoesValidas.slice(0, 5);
}

/**
 * Valida se uma abreviação é válida
 */
export function validarAbreviacao(abreviacao: string): { valido: boolean; erro?: string } {
  try {
    abreviacaoSchema.parse(abreviacao);
    return { valido: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valido: false, erro: error.errors[0].message };
    }
    return { valido: false, erro: 'Abreviação inválida' };
  }
}

/**
 * Exemplos de uso:
 * 
 * gerarSugestoesAbreviacao("Hapvida Assistência Médica LTDA")
 * // Retorna: ["HAP", "HAPV", "HM"]
 * 
 * gerarSugestoesAbreviacao("Unimed São José do Rio Preto")
 * // Retorna: ["SJR", "SJRP", "SAO", "SAOJ"]
 * 
 * gerarSugestoesAbreviacao("Cemig Saúde")
 * // Retorna: ["CS", "CEM", "CEMI", "CEMIG"]
 */
