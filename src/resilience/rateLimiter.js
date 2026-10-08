/**
 * Fila com janela deslizante de `limitPerMin` chamadas por 60s.
 * Prioridade 'preload' limitada a 50% da capacidade na janela.
 */
export class RateLimiter {
  constructor({ limitPerMin = 60, now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
    this.limite = limitPerMin;
    this.now = now;
    this.setTimer = setTimer;
    this.clearTimer = clearTimer;
    this.janela = []; // { t, preload }
    this.fila = [];
    this.pausadoAte = 0;
    this.timer = null;
    this.fechado = false;
  }

  schedule(fn, { prioridade = 'normal' } = {}) {
    return new Promise((resolve, reject) => {
      if (this.fechado) return reject(new Error('RateLimiter encerrado'));
      this.fila.push({ fn, preload: prioridade === 'preload', resolve, reject });
      this._pump();
    });
  }

  pauseUntil(ts) {
    if (ts > this.pausadoAte) this.pausadoAte = ts;
  }

  stats() {
    return {
      pendentes: this.fila.length,
      limitePorMinuto: this.limite,
      pausadoAte: this.pausadoAte > this.now() ? new Date(this.pausadoAte).toISOString() : null,
    };
  }

  close() {
    this.fechado = true;
    if (this.timer) this.clearTimer(this.timer);
    this.timer = null;
    for (const item of this.fila.splice(0)) item.reject(new Error('RateLimiter encerrado'));
  }

  _agendar(ms) {
    if (this.timer) this.clearTimer(this.timer);
    this.timer = this.setTimer(() => {
      this.timer = null;
      this._pump();
    }, Math.max(1, ms));
    this.timer.unref?.();
  }

  _pump() {
    if (this.fechado || this.fila.length === 0) return;
    const agora = this.now();
    if (this.pausadoAte > agora) return this._agendar(this.pausadoAte - agora);
    this.janela = this.janela.filter((e) => e.t > agora - 60000);
    const maxPreload = Math.max(1, Math.floor(this.limite / 2));
    while (this.fila.length > 0 && this.janela.length < this.limite) {
      const preloadUsado = this.janela.filter((e) => e.preload).length;
      const idx = this.fila.findIndex((i) => !i.preload || preloadUsado < maxPreload);
      if (idx === -1) break;
      const [item] = this.fila.splice(idx, 1);
      this.janela.push({ t: agora, preload: item.preload });
      Promise.resolve().then(item.fn).then(item.resolve, item.reject);
    }
    if (this.fila.length > 0 && this.janela.length > 0) {
      this._agendar(this.janela[0].t + 60000 - agora + 1);
    }
  }
}
