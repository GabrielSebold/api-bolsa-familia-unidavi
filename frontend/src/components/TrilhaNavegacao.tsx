interface Props {
  /** Nome do município consultado (ex.: "São Paulo/SP"); ausente quando não há município. */
  municipio?: string;
}

/** Trilha de navegação no padrão br-breadcrumb do gov.br DS. */
export function TrilhaNavegacao({ municipio }: Props) {
  return (
    <nav aria-label="Você está aqui" className="trilha">
      <ol>
        <li>
          <a href={import.meta.env.BASE_URL}>Início</a>
        </li>
        <li>{municipio ? 'Painel Bolsa Família' : <span aria-current="page">Painel Bolsa Família</span>}</li>
        {municipio ? (
          <li>
            <span aria-current="page">{municipio}</span>
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
