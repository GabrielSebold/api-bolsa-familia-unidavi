export class CircuitOpenError extends Error {
  constructor() {
    super('Circuit breaker aberto');
    this.name = 'CircuitOpenError';
    this.circuitOpen = true;
  }
}

const MIN_CHAMADAS_TAXA = 5;

export class CircuitBreaker {
  constructor({ failureThreshold = 5, failureRate = 0.5, windowMs = 60000, openMs = 60000, now = Date.now } = {}) {
    Object.assign(this, { failureThreshold, failureRate, windowMs, openMs, now });
    this._estado = 'closed';
    this._abertoEm = 0;
    this._consecutivas = 0;
    this._janela = []; // { t, ok }
    this._testeEmAndamento = false;
  }

  _podar() {
    const corte = this.now() - this.windowMs;
    this._janela = this._janela.filter((e) => e.t > corte);
  }

  state() {
    if (this._estado === 'open' && this.now() - this._abertoEm >= this.openMs) return 'half-open';
    return this._estado;
  }

  /** Verdadeiro se uma chamada pode passar. No semiaberto libera exatamente 1. */
  canRequest() {
    const s = this.state();
    if (s === 'closed') return true;
    if (s === 'open') return false;
    this._estado = 'half-open';
    if (this._testeEmAndamento) return false;
    this._testeEmAndamento = true;
    return true;
  }

  /** Apenas consulta (sem reservar a chamada de teste). */
  isOpen() {
    return this.state() === 'open';
  }

  onSuccess() {
    this._janela.push({ t: this.now(), ok: true });
    this._consecutivas = 0;
    if (this._estado === 'half-open' || this.state() === 'half-open') {
      this._estado = 'closed';
      this._testeEmAndamento = false;
      this._janela = [];
    }
  }

  onFailure() {
    const t = this.now();
    this._janela.push({ t, ok: false });
    this._consecutivas++;
    if (this._estado === 'half-open' || this.state() === 'half-open') {
      this._abrir(t);
      return;
    }
    this._podar();
    const falhas = this._janela.filter((e) => !e.ok).length;
    const taxa = falhas / this._janela.length;
    if (
      this._consecutivas >= this.failureThreshold ||
      (this._janela.length >= MIN_CHAMADAS_TAXA && taxa > this.failureRate)
    ) {
      this._abrir(t);
    }
  }

  _abrir(t) {
    this._estado = 'open';
    this._abertoEm = t;
    this._testeEmAndamento = false;
    this._consecutivas = 0;
  }

  /** Executa fn respeitando o breaker. `countAsFailure(err)` decide se o erro conta. */
  async execute(fn, countAsFailure = () => true) {
    if (!this.canRequest()) throw new CircuitOpenError();
    try {
      const r = await fn();
      this.onSuccess();
      return r;
    } catch (err) {
      if (countAsFailure(err)) this.onFailure();
      else if (this._estado === 'half-open') {
        // erro que não é falha de disponibilidade: libera a próxima tentativa de teste
        this._testeEmAndamento = false;
      }
      throw err;
    }
  }
}
