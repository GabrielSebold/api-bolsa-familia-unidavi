import { z } from 'zod';

const bool = (def) =>
  z.preprocess((v) => (v === undefined || v === '' ? def : String(v).toLowerCase() === 'true'), z.boolean());
const num = (def) => z.coerce.number().default(def);

const schema = z.object({
  PORT: num(3333),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.string().default('development'),
  LOG_LEVEL: z.string().default('info'),
  LOG_PRETTY: bool(false),
  CORS_ORIGIN: z.string().default('*'),
  PORTAL_TRANSPARENCIA_API_KEY: z.string().default(''),
  USE_MOCK: z.string().optional(),
  DB_PATH: z.string().default('./data/cache.sqlite'),
  ADMIN_TOKEN: z.string().default(''),
  RATE_LIMIT_PER_MIN: num(60),
  HTTP_TIMEOUT_MS: num(10000),
  RETRY_ATTEMPTS: num(3),
  RETRY_BASE_MS: num(1000),
  CB_FAILURE_THRESHOLD: num(5),
  CB_FAILURE_RATE: num(0.5),
  CB_WINDOW_MS: num(60000),
  CB_OPEN_MS: num(60000),
  PRELOAD_ENABLED: bool(false),
  PRELOAD_CODIGO_IBGE: z.string().default('4214805'),
  IBGE_MUNICIPIOS_URL: z
    .string()
    .default('https://servicodados.ibge.gov.br/api/v1/localidades/municipios'),
});

export function loadEnv(source = process.env) {
  // strings vazias (ex.: "PORT=" no .env) tratadas como ausentes
  const limpo = {};
  for (const k of Object.keys(schema.shape)) {
    if (source[k] !== undefined && source[k] !== '') limpo[k] = source[k];
  }
  const parsed = schema.safeParse(limpo);
  if (!parsed.success) {
    throw new Error('Variáveis de ambiente inválidas: ' + parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
  }
  const env = parsed.data;
  let chave = env.PORTAL_TRANSPARENCIA_API_KEY.trim();
  if (chave === 'COLOQUE_SUA_CHAVE_AQUI') chave = '';
  env.PORTAL_TRANSPARENCIA_API_KEY = chave;

  const useMock = (env.USE_MOCK ?? '').trim().toLowerCase();
  let modo;
  let avisoMockAutomatico = false;
  if (useMock === 'true') modo = 'mock';
  else if (useMock === 'false') modo = 'real';
  else if (!chave) {
    modo = 'mock';
    avisoMockAutomatico = true;
  } else modo = 'real';
  return { ...env, modo, avisoMockAutomatico };
}
