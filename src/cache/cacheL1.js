import { LRUCache } from 'lru-cache';

/** L1 em memória. A validade (expiraEm) é controlada pelo CacheManager com relógio injetável. */
export class CacheL1 {
  constructor({ max = 5000 } = {}) {
    this.lru = new LRUCache({ max });
  }
  get(chave) {
    return this.lru.get(chave);
  }
  set(chave, entrada) {
    this.lru.set(chave, entrada);
  }
  delete(chave) {
    return this.lru.delete(chave);
  }
  clear() {
    this.lru.clear();
  }
  size() {
    return this.lru.size;
  }
}
