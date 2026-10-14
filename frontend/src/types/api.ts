/** Origem dos dados informada pela API em `meta.origem`. */
export type Origem = 'api' | 'cache' | 'cache-desatualizado' | 'mock';

export type Metrica = 'valor' | 'familias' | 'valorMedio';

export interface TipoRepasse {
  id: string | number;
  descricao: string;
}

export interface Registro {
  codigoIbge: string;
  municipio: string;
  uf: string;
  /** AAAAMM */
  mesAno: string;
  programa: string;
  tipo: TipoRepasse;
  valor: number;
  quantidadeBeneficiados: number;
  valorMedio: number | null;
  origemId?: string;
  coletadoEm?: string;
}

export interface ConsultaSerie {
  codigoIbge: string;
  de: string;
  ate: string;
  meses: number;
}

export interface MetaResposta {
  origem: Origem;
  atualizadoEm: string;
}

export interface RespostaSerie {
  consulta: ConsultaSerie;
  dados: Registro[];
  meta: MetaResposta;
}

export interface ErroApiCorpo {
  erro: {
    codigo: string;
    mensagem: string;
    tentarNovamenteEm?: string;
  };
}

export interface Municipio {
  codigo: string;
  nome: string;
  uf: string;
}

/** Valores agregados de um mês (soma dos registros do mês). */
export interface PontoMensal {
  mesAno: string;
  valor: number;
  familias: number;
  valorMedio: number | null;
  /** Programas presentes no mês (ex.: NOVO_BOLSA_FAMILIA). */
  programas: string[];
}

/** Ponto da série contínua; `null` = sem dados no mês. */
export interface PontoSerie {
  mesAno: string;
  valor: number | null;
  familias: number | null;
  valorMedio: number | null;
  programas: string[];
}
