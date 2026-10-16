import { erroExemplo, erroSchema } from './schemas.js';
import { filtroInvalido, mesAnoInvalido, semRegistros } from '../domain/errors.js';
import { aplicarFiltros, parseFiltros, temFiltros } from '../domain/filtros.js';
import { toCSV } from '../services/export/csv.js';
import { montarJSON, serializarJSON } from '../services/export/json.js';
import { gerarPDF } from '../services/export/pdf.js';

const FORMATOS = {
  csv: { ext: 'csv', mime: 'text/csv; charset=utf-8' },
  json: { ext: 'json', mime: 'application/json; charset=utf-8' },
  pdf: { ext: 'pdf', mime: 'application/pdf' },
};

function consultar(service, { codigoIbge, mesAno, de, ate }) {
  if (mesAno !== undefined) {
    if (de !== undefined || ate !== undefined) throw mesAnoInvalido('use "mesAno" OU "de" e "ate", não ambos');
    return service.consultarMes({ codigoIbge, mesAno });
  }
  if (de !== undefined && ate !== undefined) return service.consultarSerie({ codigoIbge, de, ate });
  throw mesAnoInvalido('informe "mesAno" ou "de" e "ate"');
}

const rotulo = (m) => `${m.slice(0, 4)}-${m.slice(4)}`;

/** Nome seguro: só letras, números, "_" e "-" (nada vindo do usuário vai direto para o header). */
const slug = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

function nomeArquivo({ escopo, municipio, consulta, ext }) {
  const periodo = consulta.mesAno ? rotulo(consulta.mesAno) : `${rotulo(consulta.de)}_a_${rotulo(consulta.ate)}`;
  const partes = ['repasses_bolsa_familia'];
  if (escopo === 'filtrado') partes.push('filtrados');
  partes.push(slug(municipio) || consulta.codigoIbge, periodo);
  return `${partes.join('_')}.${ext}`;
}

const querystring = {
  type: 'object',
  required: ['codigoIbge'],
  properties: {
    codigoIbge: { type: 'string', description: 'Código IBGE (7 dígitos)', examples: ['4214805'] },
    mesAno: { type: 'string', description: 'Mês (AAAAMM)', examples: ['202401'] },
    de: { type: 'string', description: 'Início da série (AAAAMM)', examples: ['202301'] },
    ate: { type: 'string', description: 'Fim da série (AAAAMM)', examples: ['202312'] },
    escopo: { type: 'string', description: '`bruto` (padrão) ou `filtrado`', examples: ['filtrado'] },
    programa: { type: 'string', description: 'BOLSA_FAMILIA, AUXILIO_BRASIL, NOVO_BOLSA_FAMILIA (vírgula para vários)' },
    tipoId: { type: 'string', description: 'Ids de tipo, separados por vírgula' },
    valorMin: { type: 'string', description: 'Valor mínimo repassado (R$)' },
    valorMax: { type: 'string', description: 'Valor máximo repassado (R$)' },
    excel: { type: 'string', description: 'CSV: `true` usa ";" e decimal "," (Excel pt-BR)' },
  },
};

export default async function exportacaoRoutes(app, { service, now = () => new Date() }) {
  for (const [formato, { ext, mime }] of Object.entries(FORMATOS)) {
    app.get(
      `/api/v1/repasses/exportar/${formato}`,
      {
        schema: {
          tags: ['Relatórios'],
          summary: `Exporta os repasses em ${formato.toUpperCase()}`,
          description:
            'Baixa os dados da consulta. `escopo=bruto` traz todos os registros do período; `escopo=filtrado` aplica `programa`, `tipoId`, `valorMin` e `valorMax`. Sem registros, responde 404 `SEM_REGISTROS`.',
          querystring,
          response: {
            400: { description: 'Parâmetros ou filtros inválidos', ...erroSchema, examples: [erroExemplo('FILTRO_INVALIDO', 'Filtro inválido: programa "X" desconhecido')] },
            404: { description: 'Município ou registros não encontrados', ...erroSchema, examples: [erroExemplo('SEM_REGISTROS', 'Nenhum registro atende aos filtros informados.')] },
          },
        },
      },
      async (req, reply) => {
        const escopo = req.query.escopo ?? 'bruto';
        if (!['bruto', 'filtrado'].includes(escopo)) throw filtroInvalido('"escopo" deve ser "bruto" ou "filtrado"');
        const filtros = parseFiltros(req.query);
        if (escopo === 'bruto' && temFiltros(filtros)) {
          throw filtroInvalido('filtros só se aplicam com escopo=filtrado');
        }

        const resultado = await consultar(service, req.query);
        const dados = escopo === 'filtrado' ? aplicarFiltros(resultado.dados, filtros) : resultado.dados;
        if (dados.length === 0) throw semRegistros(escopo === 'filtrado' && temFiltros(filtros));

        const corpo =
          formato === 'csv'
            ? toCSV(dados, { excel: req.query.excel === 'true' })
            : formato === 'pdf'
              ? gerarPDF({ dados, consulta: resultado.consulta, meta: resultado.meta, filtros, escopo, geradoEm: now().toISOString() })
              : serializarJSON(
                montarJSON({
                  consulta: resultado.consulta,
                  escopo,
                  filtros,
                  dados,
                  meta: resultado.meta,
                  geradoEm: now().toISOString(),
                }),
              );

        const arquivo = nomeArquivo({ escopo, municipio: dados[0].municipio, consulta: resultado.consulta, ext });
        return reply
          .header('Content-Disposition', `attachment; filename="${arquivo}"`)
          .header('X-Total-Registros', String(dados.length))
          .header('Cache-Control', 'no-store')
          .type(mime)
          .send(corpo);
      },
    );
  }
}
