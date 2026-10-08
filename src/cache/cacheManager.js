import { idadeEmMeses } from '../domain/mesAno.js';

const H = 3600_000;
const D = 24 * H;

export const chaveRepasse = (codigoIbge, mesAno) => `repasse:v1:${codigoIbge}:${mesAno}`;

/** TTLs conforme spec 2.6.6. Retorna { l1, l2 } em ms. */
export function ttlPorIdade(mesAno, vazio, now = new Date()) {
  if (vazio) return { l1: 15 * 60_000, l2: 1 * H };
  const idade = idadeEmMeses(mesAno, now);
  if (idade > 3) return { l1: 24 * H, l2: 30 * D };
  if (idade >= 1) return { l1: 6 * H, l2: 3 * D };
  return { l1: 1 * H, l2: 1 * D };
}

export class CacheManager {
  constructor({ l1, l2, now = () => new Date() }) {
    this.l1 = l1;
    this.l2 = l2;
    this.now = now;
    this.contadores = { l1Hits: 0, l1Misses: 0, l2Hits: 0, l2Misses: 0, stale: 0 };
  }

  /**
   * @returns {{ estado: 'hit'|'stale'|'miss', camada?: 'l1'|'l2', entrada?: object }}
   * Em 'stale' (L2 expirado) a entrada pode ser servida em caso de erro ou com revalidação.
   */
  get(chave) {
    const t = this.now().getTime();
    const e1 = this.l1.get(chave);
    if (e1 && e1.expiraL1 > t && e1.expiraEm > t) {
      this.contadores.l1Hits++;
      return { estado: 'hit', camada: 'l1', entrada: e1 };
    }
    this.contadores.l1Misses++;
    const bruto = this.l2.get(chave);
    const e2 = bruto && { ...bruto, mesAno: chave.split(':').pop() };
    if (!e2) {
      this.contadores.l2Misses++;
      return { estado: 'miss' };
    }
    if (e2.expiraEm > t) {
      this.contadores.l2Hits++;
      this.l1.set(chave, { ...e2, expiraL1: Math.min(t + this._ttlL1(e2), e2.expiraEm) });
      return { estado: 'hit', camada: 'l2', entrada: e2 };
    }
    this.contadores.l2Misses++;
    this.contadores.stale++;
    return { estado: 'stale', entrada: e2 };
  }

  _ttlL1(entrada) {
    const mes = entrada.mesAno;
    return mes ? ttlPorIdade(mes, entrada.vazio, this.now()).l1 : 15 * 60_000;
  }

  set(chave, { registros, mesAno, coletadoEm }) {
    const agora = this.now();
    const vazio = registros.length === 0;
    const ttl = ttlPorIdade(mesAno, vazio, agora);
    const t = agora.getTime();
    const entrada = { registros, vazio, mesAno, coletadoEm, expiraEm: t + ttl.l2 };
    this.l2.set(chave, entrada);
    this.l1.set(chave, { ...entrada, expiraL1: t + ttl.l1 });
    return entrada;
  }

  delete(chave) {
    this.l1.delete(chave);
    return this.l2.delete(chave) > 0;
  }

  clear() {
    this.l1.clear();
    return this.l2.deleteAll();
  }

  stats() {
    return { ...this.contadores, tamanhoL1: this.l1.size() };
  }
}
