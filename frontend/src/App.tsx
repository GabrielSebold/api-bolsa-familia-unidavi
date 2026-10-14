import { Suspense, lazy, useEffect, useMemo } from 'react';
import { Acessibilidade } from './components/Acessibilidade';
import { BarraAcessibilidade } from './components/BarraAcessibilidade';
import { CardsIndicadores } from './components/CardsIndicadores';
import { Carregando, Erro, Vazio } from './components/Estados';
import { Filtros } from './components/Filtros';
import { FonteDados } from './components/FonteDados';
import { SeletorIndicador } from './components/SeletorIndicador';
import { TabelaDados } from './components/TabelaDados';
import { ThemeToggle } from './components/ThemeToggle';
import { useFiltrosUrl } from './hooks/useFiltrosUrl';
import { useMunicipios } from './hooks/useMunicipios';
import { useRepasses } from './hooks/useRepasses';
import { useTema } from './hooks/useTema';
import type { RespostaSerie } from './types/api';
import { formatarMesAno } from './utils/formatadores';
import { rotuloMunicipio } from './utils/busca';
import { janelaConsulta } from './utils/periodo';
import { agregarPorMes, montarSerie } from './utils/series';

// Recharts fica fora do pacote inicial: os gráficos só são baixados quando há dados.
const GraficoEvolucao = lazy(() => import('./components/GraficoEvolucao'));
const GraficoMesAMes = lazy(() => import('./components/GraficoMesAMes'));
const GraficoAnoAAno = lazy(() => import('./components/GraficoAnoAAno'));

export default function App() {
  const tema = useTema();
  const { filtros, avisos, aplicar, restaurarPadrao, dispensarAvisos } = useFiltrosUrl();
  const { municipios, fonte: fonteMunicipios } = useMunicipios();
  const janela = janelaConsulta(filtros.de, filtros.ate);
  // Uma única chamada de série por consulta, já com a janela estendida do ano a ano.
  const { estado, retry } = useRepasses({ codigoIbge: filtros.ibge, de: janela.de, ate: janela.ate });

  const municipio = municipios.find((m) => m.codigo === filtros.ibge);
  const nomeMunicipio = municipio ? rotuloMunicipio(municipio) : `município ${filtros.ibge}`;

  useEffect(() => {
    document.title = `${nomeMunicipio}, ${formatarMesAno(filtros.de)} a ${formatarMesAno(filtros.ate)} | Bolsa Família em números`;
  }, [nomeMunicipio, filtros.de, filtros.ate]);

  // Entre a mudança dos filtros e o início da nova consulta, não mostra dados da consulta anterior.
  const resposta: RespostaSerie | null =
    (estado.status === 'success' || estado.status === 'empty') &&
    estado.resposta.consulta.codigoIbge === filtros.ibge &&
    estado.resposta.consulta.de === janela.de &&
    estado.resposta.consulta.ate === janela.ate
      ? estado.resposta
      : null;

  const dados = useMemo(() => {
    if (!resposta || resposta.dados.length === 0) return null;
    const pontos = agregarPorMes(resposta.dados);
    const serieEstendida = montarSerie(pontos, janela.de, janela.ate);
    const serie = montarSerie(pontos, filtros.de, filtros.ate);
    return { serie, serieEstendida };
  }, [resposta, janela.de, janela.ate, filtros.de, filtros.ate]);

  const carregando = estado.status === 'loading' || estado.status === 'idle' || (estado.status !== 'error' && !resposta);

  return (
    <>
      <BarraAcessibilidade />
      <header className="cabecalho">
        <div className="container cabecalho__interno">
          <h1>Bolsa Família em números</h1>
          <ThemeToggle preferencia={tema.preferencia} onChange={tema.definir} />
        </div>
      </header>
      <main id="conteudo" className="container principal" tabIndex={-1}>
        <Filtros
          filtros={filtros}
          avisos={avisos}
          municipios={municipios}
          fonteMunicipios={fonteMunicipios}
          onAplicar={aplicar}
          onRestaurar={restaurarPadrao}
          onDispensarAvisos={dispensarAvisos}
        />
        <section id="graficos" aria-labelledby="titulo-graficos" tabIndex={-1}>
          <h2 id="titulo-graficos">Indicadores e gráficos</h2>
          <p className="contexto">
            {nomeMunicipio}, de {formatarMesAno(filtros.de)} a {formatarMesAno(filtros.ate)}
          </p>
          <div className="somente-leitor" role="status" aria-live="polite">
            {dados
              ? `Dados atualizados: ${nomeMunicipio}, de ${formatarMesAno(filtros.de)} a ${formatarMesAno(filtros.ate)}.`
              : ''}
          </div>
          {carregando ? <Carregando /> : null}
          {estado.status === 'error' ? <Erro erro={estado.erro} onTentarNovamente={retry} /> : null}
          {resposta && !dados ? <Vazio /> : null}
          {dados ? (
            <>
              <CardsIndicadores key={`${filtros.ibge}-${filtros.de}-${filtros.ate}`} serie={dados.serie} />
              <SeletorIndicador valor={filtros.ind} onChange={(ind) => aplicar({ ...filtros, ind })} />
              <Suspense fallback={<Carregando mensagem="Carregando gráficos…" />}>
                <div className="graficos">
                  <GraficoEvolucao serie={dados.serie} metrica={filtros.ind} />
                  <GraficoMesAMes serie={dados.serie} metrica={filtros.ind} />
                  <GraficoAnoAAno serie={dados.serieEstendida} metrica={filtros.ind} de={filtros.de} ate={filtros.ate} />
                </div>
              </Suspense>
            </>
          ) : null}
        </section>
        <section id="tabela" aria-labelledby="titulo-tabela" tabIndex={-1}>
          <h2 id="titulo-tabela">Tabela de dados</h2>
          {dados ? (
            <TabelaDados
              serie={dados.serie}
              serieEstendida={dados.serieEstendida}
              metrica={filtros.ind}
              de={filtros.de}
              ate={filtros.ate}
            />
          ) : (
            <p>A tabela aparece aqui quando a consulta retornar dados.</p>
          )}
        </section>
        {resposta ? <FonteDados meta={resposta.meta} /> : null}
        <Acessibilidade />
      </main>
      <footer className="rodape">
        <div className="container">
          <p>
            Dados públicos do Portal da Transparência (CGU). Esta página não usa rastreadores nem análise de uso.{' '}
            <a href="#acessibilidade">Acessibilidade</a>
          </p>
        </div>
      </footer>
    </>
  );
}
