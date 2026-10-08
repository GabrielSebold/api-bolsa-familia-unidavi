import { createHash, timingSafeEqual } from 'node:crypto';
import { AppError, mesAnoInvalido } from '../domain/errors.js';
import { erroExemplo, erroSchema } from './schemas.js';

const h = (s) => createHash('sha256').update(String(s)).digest();

/** Registrada SOMENTE quando ADMIN_TOKEN está definido. */
export default async function cacheRoutes(app, { service, adminToken }) {
  app.delete(
    '/api/v1/cache',
    {
      schema: {
        tags: ['Administração'],
        summary: 'Invalida o cache (um município/mês ou todo o cache)',
        description: 'Requer o header `x-admin-token`. Sem `codigoIbge` e `mesAno`, limpa todo o cache de repasses.',
        security: [{ adminToken: [] }],
        querystring: {
          type: 'object',
          properties: { codigoIbge: { type: 'string', examples: ['4214805'] }, mesAno: { type: 'string', examples: ['202401'] } },
        },
        response: {
          200: { description: 'Entradas removidas', type: 'object', properties: { removidos: { type: 'integer' } }, examples: [{ removidos: 1 }] },
          400: { description: 'Parâmetros inválidos', ...erroSchema },
          401: { description: 'Token ausente ou incorreto', ...erroSchema, examples: [erroExemplo('NAO_AUTORIZADO', 'Token administrativo ausente ou inválido.')] },
        },
      },
    },
    async (req) => {
      const token = req.headers['x-admin-token'];
      if (typeof token !== 'string' || !timingSafeEqual(h(token), h(adminToken))) {
        throw new AppError('NAO_AUTORIZADO', 401, 'Token administrativo ausente ou inválido.');
      }
      const { codigoIbge, mesAno } = req.query;
      if (Boolean(codigoIbge) !== Boolean(mesAno)) throw mesAnoInvalido('informe "codigoIbge" e "mesAno" juntos, ou nenhum para limpar tudo');
      return { removidos: service.invalidar({ codigoIbge, mesAno }) };
    },
  );
}
