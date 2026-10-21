import { describe, expect, it } from 'vitest';
import { consultaDe } from './consulta';
import { janelaConsulta } from './periodo';

describe('consultaDe', () => {
  it('sem município não há consulta (nenhuma requisição)', () => {
    expect(consultaDe({ ibge: null, de: '202501', ate: '202512', ind: 'valor', aba: 'visao' })).toBeNull();
  });

  it('com município usa a janela estendida da consulta', () => {
    expect(consultaDe({ ibge: '3550308', de: '202501', ate: '202512', ind: 'valor', aba: 'visao' })).toEqual({
      codigoIbge: '3550308',
      ...janelaConsulta('202501', '202512'),
    });
  });
});
