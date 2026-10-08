import { loadEnv } from './config/env.js';
import { buildApp } from './app.js';

const env = loadEnv();
const app = await buildApp({ env });

if (env.avisoMockAutomatico) {
  app.log.warn('PORTAL_TRANSPARENCIA_API_KEY ausente e USE_MOCK não definido: iniciando em MODO MOCK (dados fictícios).');
}
if (env.modo === 'real' && !env.PORTAL_TRANSPARENCIA_API_KEY) {
  app.log.error('Modo real sem PORTAL_TRANSPARENCIA_API_KEY: consultas responderão 502 CHAVE_API_AUSENTE_OU_INVALIDA.');
}

let encerrando = false;
async function encerrar(sinal) {
  if (encerrando) return;
  encerrando = true;
  app.log.info({ sinal }, 'Encerrando...');
  try {
    await app.close();
    process.exit(0);
  } catch (err) {
    app.log.error({ err: err.message }, 'Erro ao encerrar');
    process.exit(1);
  }
}
process.on('SIGINT', () => encerrar('SIGINT'));
process.on('SIGTERM', () => encerrar('SIGTERM'));

await app.listen({ port: env.PORT, host: env.HOST });
app.log.info(`Swagger UI: http://localhost:${env.PORT}/docs (modo: ${env.modo})`);
