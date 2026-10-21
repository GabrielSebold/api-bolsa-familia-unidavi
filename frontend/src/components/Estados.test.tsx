import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EstadoInicial } from './Estados';

describe('EstadoInicial', () => {
  it('orienta a escolher um município sem usar role="alert"', () => {
    const html = renderToStaticMarkup(<EstadoInicial />);
    expect(html).toContain('Escolha um município para ver os dados');
    expect(html).not.toContain('role="alert"');
  });
});
