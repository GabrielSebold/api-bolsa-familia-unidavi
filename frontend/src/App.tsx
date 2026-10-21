import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { AbasPainel, idDaAba, type DefinicaoAba } from './components/AbasPainel';
import { Acessibilidade } from './components/Acessibilidade';
import { BarraAcessibilidade } from './components/BarraAcessibilidade';
import { Cabecalho } from './components/Cabecalho';
import { CardsIndicadores } from './components/CardsIndicadores';
import { Carregando, EstadoInicial, Erro, Vazio } from './components/Estados';
import { Filtros } from './components/Filtros';
import { FonteDados } from './components/FonteDados';
import { RankingMeses } from './components/RankingMeses';
import { RelatoriosExportacao } from './components/RelatoriosExportacao';
import { ID_BOTAO_ATUALIZAR, ResumoPeriodo } from './components/ResumoPeriodo';
import { Rodape } from './components/Rodape';
import { SeletorIndicador } from './components/SeletorIndicador';
import { TabelaDados } from './components/TabelaDados';
import { TrilhaNavegacao } from './components/TrilhaNavegacao';
import { useFiltrosUrl, type Aba } from './hooks/useFiltrosUrl';
import { useMunicipios } from './hooks/useMunicipios';
import { useRepasses } from './hooks/useRepasses';
import { useTema } from './hooks/useTema';
import type { RespostaSerie } from './types/api';
import { formatarMesAno } from './utils/formatadores';
import { nomeMunicipio } from './utils/busca';
import { consultaDe } from './utils/consulta';
import { janelaConsulta } from './utils/periodo';
import { agregarPorMes, montarSerie } from './utils/series';

// Recharts fica fora do pacote inicial: os gráficos só são baixados ao abrir a aba Gráficos com dados.
const GraficoEvolucao = lazy(() => import('./components/GraficoEvolucao'));
const GraficoMesAMes = lazy(() => import('./components/GraficoMesAMes'));
const GraficoAnoAAno = lazy(() => import('./components/GraficoAnoAAno'));

// Os ids dos painéis são os alvos dos atalhos [3] (#graficos) e [4] (#tabela).
const ABAS_PAINEL: readonly DefinicaoAba[] = [
  { id: 'visao', rotulo: 'Visão geral', idPainel: 'visao-geral' },
  { id: 'graficos', rotulo: 'Gráficos', idPainel: 'graficos' },
  { id: 'tabela', rotulo: 'Tabela', idPainel: 'tabela' },
];

export default function App() {
  const tema = useTema();
  const { filtros, avisos, aplicar, restaurarPadrao, dispensarAvisos } = useFiltrosUrl();
  const { municipios, fonte: fonteMunicipios } = useMunicipios();
  // Sem município não há consulta: o painel fica no estado inicial e não chama a API.
  const consulta = consultaDe(filtros);
  const janela = consulta ?? janelaConsulta(filtros.de, filtros.ate);
  // Uma única chamada de série por consulta, já com a janela estendida do ano a ano.
  const { estado, retry } = useRepasses(consulta);
  const semMunicipio = filtros.ibge === null;
  // Só anuncia "Nenhum município selecionado." depois que o usuário limpa os filtros, não ao abrir a página.
  const [limpou, setLimpou] = useState(false);

  const municipio = filtros.ibge ? municipios.find((m) => m.codigo === filtros.ibge) : undefined;

  // Aba: com município fica na URL (?aba=, Voltar/Avançar restaura); sem município é só estado local.
  const [abaLocal, setAbaLocal] = useState<Aba>(filtros.aba);
  const abaAtiva = semMunicipio ? abaLocal : filtros.aba;
  // Ao aplicar filtros a aba aberta é mantida (inclusive a local, quando é o primeiro município).
  const trocarAba = (aba: Aba) => {
    if (semMunicipio) setAbaLocal(aba);
    else if (aba !== filtros.aba) aplicar({ ...filtros, aba });
  };

  const limparFiltros = () => {
    setLimpou(true);
    setAbaLocal('visao');
    restaurarPadrao();
  };

  // Entre a mudança dos filtros e o início da nova consulta, não mostra dados da consulta anterior.
  const resposta: RespostaSerie | null =
    (estado.status === 'success' || estado.status === 'empty') &&
    estado.resposta.consulta.codigoIbge === filtros.ibge &&
    estado.resposta.consulta.de === janela.de &&
    estado.resposta.consulta.ate === janela.ate
      ? estado.resposta
      : null;

  // Nome para trilha, título, contexto e anúncio: lista IBGE → registros da API → "Município 1234567".
  const nome = nomeMunicipio(filtros.ibge, municipios, resposta?.dados ?? []);

  useEffect(() => {
    document.title = nome
      ? `${nome}, ${formatarMesAno(filtros.de)} a ${formatarMesAno(filtros.ate)} | Painel Bolsa Família`
      : 'Escolha um município | Painel Bolsa Família';
  }, [nome, filtros.de, filtros.ate]);

  const dados = useMemo(() => {
    if (!resposta || resposta.dados.length === 0) return null;
    const pontos = agregarPorMes(resposta.dados);
    const serieEstendida = montarSerie(pontos, janela.de, janela.ate);
    const serie = montarSerie(pontos, filtros.de, filtros.ate);
    return { serie, serieEstendida };
  }, [resposta, janela.de, janela.ate, filtros.de, filtros.ate]);

  const carregando =
    consulta !== null &&
    (estado.status === 'loading' || estado.status === 'idle' || (estado.status !== 'error' && !resposta));

  // "Atualizar dados": durante a nova consulta o painel some (não mostra dados antigos), então o foco
  // vai para o painel #visao-geral e volta ao botão quando os dados chegam (não cai no body).
  const focoNoAtualizar = useRef(false);
  const atualizarDados = () => {
    if (document.activeElement?.id === ID_BOTAO_ATUALIZAR) {
      focoNoAtualizar.current = true;
      document.getElementById('visao-geral')?.focus({ preventScroll: true });
    }
    retry();
  };
  useEffect(() => {
    if (estado.status === 'error') focoNoAtualizar.current = false;
    if (!dados || !focoNoAtualizar.current) return;
    focoNoAtualizar.current = false;
    document.getElementById(ID_BOTAO_ATUALIZAR)?.focus({ preventScroll: true });
  }, [dados, estado.status]);

  let anuncio = '';
  if (semMunicipio) anuncio = limpou ? 'Nenhum município selecionado.' : '';
  else if (dados) anuncio = `Dados atualizados: ${nome}, de ${formatarMesAno(filtros.de)} a ${formatarMesAno(filtros.ate)}.`;

  // Texto dos painéis Gráficos e Tabela enquanto não há dados (erro e carregamento ficam na Visão geral).
  const orientacao = (oQue: string) =>
    semMunicipio
      ? `${oQue} aqui depois que você escolher um município e aplicar os filtros.`
      : estado.status === 'error'
        ? 'Não foi possível carregar os dados. Veja os detalhes e tente novamente na aba Visão geral.'
        : `${oQue} aqui quando a consulta retornar dados.`;

  return (
    <>
      <BarraAcessibilidade onAtivarAba={trocarAba} />
      <Cabecalho preferencia={tema.preferencia} onChange={tema.definir} />
      <div className="container">
        <TrilhaNavegacao municipio={nome ?? undefined} />
      </div>
      <main id="conteudo" className="container principal" tabIndex={-1}>
        <h1 className="titulo-pagina">Repasses do Bolsa Família por município</h1>
        <Filtros
          filtros={filtros}
          avisos={avisos}
          municipios={municipios}
          fonteMunicipios={fonteMunicipios}
          onAplicar={(f) => aplicar({ ...f, aba: abaAtiva })}
          onRestaurar={limparFiltros}
          onDispensarAvisos={dispensarAvisos}
        />
        <div className="abas-painel">
          {nome ? (
            <p className="contexto">
              {nome}, de {formatarMesAno(filtros.de)} a {formatarMesAno(filtros.ate)}
            </p>
          ) : null}
          {/* Fora dos painéis ocultáveis: o anúncio vale para qualquer aba aberta. */}
          <div className="somente-leitor" role="status" aria-live="polite">
            {anuncio}
          </div>
          <AbasPainel abas={ABAS_PAINEL} ativa={abaAtiva} onChange={trocarAba} />
        </div>
        <section
          id="visao-geral"
          role="tabpanel"
          aria-labelledby={idDaAba('visao')}
          tabIndex={-1}
          hidden={abaAtiva !== 'visao'}
        >
          <h2>Visão geral</h2>
          {semMunicipio ? <EstadoInicial /> : null}
          {carregando ? <Carregando /> : null}
          {!semMunicipio && estado.status === 'error' ? <Erro erro={estado.erro} onTentarNovamente={retry} /> : null}
          {resposta && !dados ? <Vazio /> : null}
          {dados && resposta ? (
            <>
              <div className="visao-geral">
                <ResumoPeriodo
                  nomeMunicipio={nome ?? ''}
                  codigoIbge={resposta.consulta.codigoIbge}
                  de={filtros.de}
                  ate={filtros.ate}
                  serie={dados.serie}
                  meta={resposta.meta}
                  onAtualizar={atualizarDados}
                  atualizando={carregando}
                />
                <div className="visao-geral__indicadores">
                  <CardsIndicadores key={`${filtros.ibge}-${filtros.de}-${filtros.ate}`} serie={dados.serie} />
                  <RankingMeses serie={dados.serie} metrica={filtros.ind} />
                </div>
              </div>
            </>
          ) : null}
        </section>
        <section
          id="graficos"
          role="tabpanel"
          aria-labelledby={idDaAba('graficos')}
          tabIndex={-1}
          hidden={abaAtiva !== 'graficos'}
        >
          <h2 id="titulo-graficos">Gráficos</h2>
          {dados ? (
            <>
              <SeletorIndicador valor={filtros.ind} onChange={(ind) => aplicar({ ...filtros, ind })} />
              {/* Só monta os gráficos com a aba aberta: o Recharts não é baixado antes. */}
              {abaAtiva === 'graficos' ? (
                <Suspense fallback={<Carregando mensagem="Carregando gráficos…" />}>
                  <div className="graficos">
                    <GraficoEvolucao serie={dados.serie} metrica={filtros.ind} />
                    <GraficoMesAMes serie={dados.serie} metrica={filtros.ind} />
                    <GraficoAnoAAno serie={dados.serieEstendida} metrica={filtros.ind} de={filtros.de} ate={filtros.ate} />
                  </div>
                </Suspense>
              ) : null}
            </>
          ) : (
            <p>{orientacao('Os gráficos aparecem')}</p>
          )}
        </section>
        <section
          id="tabela"
          role="tabpanel"
          aria-labelledby={idDaAba('tabela')}
          tabIndex={-1}
          hidden={abaAtiva !== 'tabela'}
        >
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
            <p>{orientacao('A tabela aparece')}</p>
          )}
        </section>
        {!semMunicipio && resposta ? <FonteDados meta={resposta.meta} /> : null}
        {!semMunicipio ? (
          <RelatoriosExportacao filtros={filtros} municipio={municipio} registros={resposta?.dados ?? []} consultaCompleta={resposta?.consulta} disponivel={!!resposta && resposta.dados.length > 0} />
        ) : null}
        <Acessibilidade />
      </main>
      <Rodape />
    </>
  );
}
