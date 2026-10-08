import { DatabaseSync } from 'node:sqlite'; // API experimental: todo acesso ao SQLite fica isolado aqui
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export class CacheL2 {
  constructor(dbPath = './data/cache.sqlite') {
    if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    if (dbPath !== ':memory:') this.db.exec('PRAGMA journal_mode=WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cache_repasse (
        chave TEXT PRIMARY KEY, payload TEXT NOT NULL, vazio INTEGER NOT NULL,
        coletado_em TEXT NOT NULL, expira_em INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS municipios (codigo TEXT PRIMARY KEY, nome TEXT NOT NULL, uf TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS meta (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);
    `);
    this.stGet = this.db.prepare('SELECT payload, vazio, coletado_em, expira_em FROM cache_repasse WHERE chave = ?');
    this.stSet = this.db.prepare(
      'INSERT OR REPLACE INTO cache_repasse (chave, payload, vazio, coletado_em, expira_em) VALUES (?, ?, ?, ?, ?)',
    );
    this.stDel = this.db.prepare('DELETE FROM cache_repasse WHERE chave = ?');
    this.stDelAll = this.db.prepare('DELETE FROM cache_repasse');
    this.stMunCount = this.db.prepare('SELECT COUNT(*) AS n FROM municipios');
    this.stMunGet = this.db.prepare('SELECT codigo, nome, uf FROM municipios WHERE codigo = ?');
    this.stMunSet = this.db.prepare('INSERT OR REPLACE INTO municipios (codigo, nome, uf) VALUES (?, ?, ?)');
    this.stMetaGet = this.db.prepare('SELECT valor FROM meta WHERE chave = ?');
    this.stMetaSet = this.db.prepare('INSERT OR REPLACE INTO meta (chave, valor) VALUES (?, ?)');
  }

  get(chave) {
    const r = this.stGet.get(chave);
    if (!r) return null;
    return {
      registros: JSON.parse(r.payload),
      vazio: r.vazio === 1,
      coletadoEm: r.coletado_em,
      expiraEm: r.expira_em,
    };
  }
  set(chave, { registros, vazio, coletadoEm, expiraEm }) {
    this.stSet.run(chave, JSON.stringify(registros), vazio ? 1 : 0, coletadoEm, expiraEm);
  }
  delete(chave) {
    return Number(this.stDel.run(chave).changes);
  }
  deleteAll() {
    return Number(this.stDelAll.run().changes);
  }

  municipiosCount() {
    return this.stMunCount.get().n;
  }
  municipioGet(codigo) {
    return this.stMunGet.get(codigo) ?? null;
  }
  municipiosReplace(lista) {
    this.db.exec('BEGIN');
    try {
      for (const m of lista) this.stMunSet.run(m.codigo, m.nome, m.uf);
      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
  metaGet(chave) {
    return this.stMetaGet.get(chave)?.valor ?? null;
  }
  metaSet(chave, valor) {
    this.stMetaSet.run(chave, String(valor));
  }

  close() {
    if (this.db?.isOpen) this.db.close();
  }
}
