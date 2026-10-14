import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

type Tokens = Record<string, string>;

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'tokens.css'), 'utf8');

function blocos(tema: 'claro' | 'escuro'): Tokens {
  const tokens: Tokens = {};
  for (const [, seletor, corpo] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (!seletor?.includes(`[data-theme='${tema}']`)) continue;
    for (const [, nome, valor] of (corpo ?? '').matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
      if (nome && valor) tokens[nome] = valor;
    }
  }
  return tokens;
}

function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (canais[0] ?? 0) + 0.7152 * (canais[1] ?? 0) + 0.0722 * (canais[2] ?? 0);
}

export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return ((l1 ?? 0) + 0.05) / ((l2 ?? 0) + 0.05);
}

/** Pares [primeiro plano, fundo] de texto (>= 4,5:1). */
const TEXTO: [string, string][] = [
  ['--cor-texto', '--cor-fundo'],
  ['--cor-texto', '--cor-superficie'],
  ['--cor-texto-suave', '--cor-fundo'],
  ['--cor-texto-suave', '--cor-superficie'],
  ['--cor-link', '--cor-fundo'],
  ['--cor-link', '--cor-superficie'],
  ['--cor-primaria-texto', '--cor-primaria'],
  ['--cor-erro-texto', '--cor-erro-fundo'],
  ['--cor-aviso-texto', '--cor-aviso-fundo'],
  ['--cor-info-texto', '--cor-info-fundo'],
];

/** Componentes e elementos gráficos (>= 3:1) contra os dois fundos. */
const NAO_TEXTO = [
  '--cor-borda',
  '--cor-foco',
  '--cor-primaria',
  '--cor-grafico-1',
  '--cor-grafico-2',
  '--cor-grafico-3',
  '--cor-grafico-4',
  '--cor-grafico-5',
  '--cor-grafico-positivo',
  '--cor-grafico-negativo',
  '--cor-grafico-eixo',
];

describe.each(['claro', 'escuro'] as const)('contraste do tema %s', (tema) => {
  const t = blocos(tema);

  it('define todos os tokens usados nos pares', () => {
    for (const nome of [...TEXTO.flat(), ...NAO_TEXTO, '--cor-fundo', '--cor-superficie']) {
      expect(t[nome], `${nome} ausente em ${tema}`).toBeDefined();
    }
  });

  it.each(TEXTO)('texto %s sobre %s tem pelo menos 4,5:1', (fg, bg) => {
    expect(contraste(t[fg] as string, t[bg] as string)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NAO_TEXTO)('%s tem pelo menos 3:1 sobre o fundo e a superfície', (nome) => {
    expect(contraste(t[nome] as string, t['--cor-fundo'] as string)).toBeGreaterThanOrEqual(3);
    expect(contraste(t[nome] as string, t['--cor-superficie'] as string)).toBeGreaterThanOrEqual(3);
  });
});
