import type { Filtros } from '../hooks/useFiltrosUrl';
import type { ConsultaRepasses } from '../hooks/useRepasses';
import { janelaConsulta } from './periodo';

/** Consulta de repasses dos filtros; null sem município (nenhuma requisição à API). */
export function consultaDe(f: Filtros): ConsultaRepasses | null {
  if (f.ibge === null) return null;
  return { codigoIbge: f.ibge, ...janelaConsulta(f.de, f.ate) };
}
