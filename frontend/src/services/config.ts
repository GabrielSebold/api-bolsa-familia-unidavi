const PADRAO = 'http://localhost:3333';

/** URL base da API do projeto, sem barra final. */
export const API_URL: string = ((import.meta.env.VITE_API_URL as string | undefined) || PADRAO).replace(/\/+$/, '');

export const TIMEOUT_API_MS = 90_000;
export const TIMEOUT_IBGE_MS = 20_000;
