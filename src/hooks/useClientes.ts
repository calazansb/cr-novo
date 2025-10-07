import { useState } from 'react';

export const CLIENTES_PADRAO = [
  "Affiance Life",
  "Casu - UFMG",
  "Cemig Saúde",
  "Confiança LTDA",
  "Hapvida Assistência Médica LTDA",
  "Samp ES Assistência Médica",
  "Unimed Curvelo",
  "Unimed Divinópolis",
  "Unimed Itaúna",
  "Unimed Norte Fluminense",
  "Unimed São José do Rio Preto",
  "Unimed Vertente do Caparaó",
  "Unimed Vitória",
  "Outros"
];

export const useClientes = () => {
  const [clientes] = useState<string[]>(CLIENTES_PADRAO);
  
  return { clientes };
};
