import cron from 'node-cron';
import { mesAnoAtual, somarMeses } from '../domain/mesAno.js';

/** Pré-carga agendada (02:00 America/Sao_Paulo). Retorna { stop() }. */
export function startPreload({ env, service, cache, logger, now = () => new Date() }) {
  if (!env.PRELOAD_ENABLED) return { stop() {}, executar: async () => {} };
  if (env.modo === 'mock') {
    logger?.info?.('Pré-carga ignorada em modo mock');
    return { stop() {}, executar: async () => {} };
  }
  const codigoIbge = env.PRELOAD_CODIGO_IBGE;

  async function executar() {
    const atual = mesAnoAtual(now());
    const primeira = !cache.l2.get(`repasse:v1:${codigoIbge}:${atual}`) && !cache.l2.get(`repasse:v1:${codigoIbge}:${somarMeses(atual, -1)}`);
    const qtd = primeira ? 24 : 3;
    logger?.info?.({ codigoIbge, meses: qtd }, 'Pré-carga iniciada');
    let ok = 0;
    for (let i = 0; i < qtd; i++) {
      try {
        await service.consultarMes({ codigoIbge, mesAno: somarMeses(atual, -i), prioridade: 'preload', forcar: true });
        ok++;
      } catch (err) {
        logger?.warn?.({ codigo: err.codigo, mesAno: somarMeses(atual, -i) }, 'Pré-carga: falha em um mês');
      }
    }
    logger?.info?.({ codigoIbge, ok, total: qtd }, 'Pré-carga concluída');
  }

  const task = cron.schedule('0 2 * * *', () => executar().catch((e) => logger?.error?.({ err: e.message }, 'Pré-carga falhou')), {
    timezone: 'America/Sao_Paulo',
  });
  logger?.info?.({ codigoIbge }, 'Pré-carga agendada para 02:00 (America/Sao_Paulo)');
  return {
    executar,
    stop() {
      task.stop();
      task.destroy?.();
    },
  };
}
