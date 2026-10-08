const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function calcularEspera(tentativa, { baseMs = 1000, maxMs = 30000, jitterMs = 500, random = Math.random } = {}) {
  return Math.min(maxMs, baseMs * 2 ** tentativa) + Math.floor(random() * jitterMs);
}

/**
 * Executa fn até `attempts` vezes (total de chamadas). Retenta se o erro tiver `retryable`.
 * Espera: min(maxMs, baseMs*2^tentativa)+jitter, ou `retryAfterMs` do erro quando presente.
 */
export async function withRetry(
  fn,
  {
    attempts = 3,
    baseMs = 1000,
    maxMs = 30000,
    jitterMs = 500,
    sleep = defaultSleep,
    random = Math.random,
    shouldRetry = (e) => e?.retryable === true,
    onRetry,
  } = {},
) {
  let ultimo;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn(i);
    } catch (err) {
      ultimo = err;
      if (i === attempts - 1 || !shouldRetry(err)) throw err;
      const espera =
        typeof err.retryAfterMs === 'number'
          ? err.retryAfterMs
          : calcularEspera(i, { baseMs, maxMs, jitterMs, random });
      onRetry?.(err, i + 1, espera);
      await sleep(espera);
    }
  }
  throw ultimo;
}
