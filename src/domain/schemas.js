import { z } from 'zod';

export const BeneficioPorMunicipioSchema = z.looseObject({
  id: z.number(),
  dataReferencia: z.string(),
  municipio: z.looseObject({
    codigoIBGE: z.string(),
    nomeIBGE: z.string(),
    uf: z.looseObject({ sigla: z.string(), nome: z.string().optional() }),
  }),
  tipo: z.looseObject({
    id: z.number(),
    descricao: z.string(),
    descricaoDetalhada: z.string().nullish(),
  }),
  valor: z.number(),
  quantidadeBeneficiados: z.number(),
});

export const BeneficiosArraySchema = z.array(BeneficioPorMunicipioSchema);
