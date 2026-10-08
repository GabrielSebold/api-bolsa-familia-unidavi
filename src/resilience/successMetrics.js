const HORA = 3600_000;

export class SuccessMetrics {
  constructor({ now = Date.now, onLowRate, minSamples = 10, meta = 0.95 } = {}) {
    Object.assign(this, { now, onLowRate, minSamples, meta });
    this.eventos = []; // { t, ok }
  }
  _podar() {
    const corte = this.now() - HORA;
    while (this.eventos.length && this.eventos[0].t <= corte) this.eventos.shift();
  }
  record(ok) {
    this.eventos.push({ t: this.now(), ok: !!ok });
    this._podar();
    const s = this.snapshot();
    if (s.total >= this.minSamples && s.taxa < this.meta) this.onLowRate?.(s);
  }
  taxa() {
    return this.snapshot().taxa;
  }
  snapshot() {
    this._podar();
    const total = this.eventos.length;
    const sucessos = this.eventos.filter((e) => e.ok).length;
    return { total, sucessos, falhas: total - sucessos, taxa: total === 0 ? null : sucessos / total, janela: '1h', meta: this.meta };
  }
}
