export default async function saudeRoutes(app, { getSaude }) {
  app.get(
    '/api/v1/saude',
    {
      schema: {
        tags: ['Saúde'],
        summary: 'Estado do módulo (modo, circuit breaker, cache, última coleta, fila)',
        response: {
          200: {
            description: 'Estado atual',
            type: 'object',
            additionalProperties: true,
            examples: [
              {
                status: 'ok',
                uptimeSegundos: 120,
                modo: 'mock',
                circuitBreaker: { estado: 'closed' },
                taxaSucessoExterna: { total: 0, sucessos: 0, falhas: 0, taxa: null, janela: '1h', meta: 0.95 },
                cache: { l1Hits: 0, l1Misses: 0, l2Hits: 0, l2Misses: 0, stale: 0, tamanhoL1: 0 },
                ultimaColeta: null,
                filaRateLimit: { pendentes: 0, limitePorMinuto: 60, pausadoAte: null },
              },
            ],
          },
        },
      },
    },
    async () => getSaude(),
  );
}
