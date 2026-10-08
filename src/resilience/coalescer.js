export class Coalescer {
  constructor() {
    this.emVoo = new Map();
  }
  coalesce(key, fn) {
    const existente = this.emVoo.get(key);
    if (existente) return existente;
    const p = Promise.resolve()
      .then(fn)
      .finally(() => this.emVoo.delete(key));
    this.emVoo.set(key, p);
    return p;
  }
}
