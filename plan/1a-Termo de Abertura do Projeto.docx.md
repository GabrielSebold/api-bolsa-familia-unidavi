

| Controle de Versões |  |  |  |
| :---: | :---: | :---: | :---: |
| **Versão** | **Data** | **Autor** | **Notas da Revisão** |
| 1.0 | 24/09/2026 | Rafael Arthur de Lima Silva, Kauan Faust, [Leonardo Casa Nova](mailto:leonardo.casanova@unidavi.edu.br), Gabriel Sebold dos Santos, Guilherme Demarchi Cembranel, Lucas Eduardo Demétrio    |  |
| 1.1 | 01/09/2026 | Rafael Arthur de Lima Silva, Kauan Faust, [Leonardo Casa Nova](mailto:leonardo.casanova@unidavi.edu.br), Gabriel Sebold dos Santos, Guilherme Demarchi Cembranel, Lucas Eduardo Demétrio    | Corrigido os seguintes pontos: 3\. Objetivos e Critérios de sucesso do projeto; 4\. Estrutura Analítica do Projeto \- Fases e principais entregas; 5\. Principais requisitos das principais entregas/produtos; 6\. Marcos e Gerente do Projeto(Aprovações).  |

 

Sumário  
[1	Objetivos deste documento	1](#objetivos-deste-documento)

[2	Situação atual e justificativa do projeto	1](#situação-atual-e-justificativa-do-projeto)

[3	Objetivos SMART e critérios de sucesso do projeto	1](#objetivos-e-critérios-de-sucesso-do-projeto)

[4	Estrutura Analítica do Projeto – Fases e principais entregas	2](#estrutura-analítica-do-projeto-–-fases-e-principais-entregas) 

[5	Principais requisitos das principais entregas/produtos	2](#principais-requisitos-das-principais-entregas/produtos)

[6	Marcos	2](#marcos)

[7	Partes interessadas do projeto	2](#partes-interessadas-do-projeto)

[8	Restrições	3](#restrições)

[9	Premissas	3](#premissas)

[10	Riscos	3](#riscos)

[11	Orçamento do Projeto	3](#heading=h.m67l70r1ngo2)

1. # **Objetivos deste documento**  {#objetivos-deste-documento}

Este documento apresenta o desenvolvimento de uma aplicação web voltada à transparência pública, com o objetivo de visualizar e analisar a distribuição de recursos do programa Bolsa Família em nível municipal. A partir da integração direta com a API de Dados Abertos do Portal da Transparência do Governo Federal, o sistema extrai e processa automaticamente os dados de repasses financeiros utilizando o código IBGE das cidades. A plataforma centraliza essas informações em um painel interativo (*dashboard*), traduzindo dados brutos em indicadores claros, gráficos dinâmicos e relatórios exportáveis, o que facilita o acompanhamento e fortalece o controle social e a fiscalização do uso das verbas públicas por parte dos cidadãos. 

2. # **Situação atual e justificativa do projeto** {#situação-atual-e-justificativa-do-projeto}

O bolsa família é um dos maiores programas de transferência de renda do Brasil e movimenta bilhões de reais por ano, distribuídos entre todos os municípios do país. Os dados de repasse já são públicos e estão disponíveis no Portal de Transparência e em sua API de Dados Abertos. Porém essas informações aparecem em tabelas extensas e em formato técnico, o que dificulta a consulta para a maior parte da população.   
Atualmente não existe uma forma simples e visual de saber quando cada município recebe do programa ou de acompanhar a evolução desses valores ao longo do tempo. Sem esse acesso facilitado, o cidadão encontra dificuldade para compreender os dados, e consequentemente, para acompanhar e fiscalizar a aplicação dos recursos públicos em sua cidade  
Justificativa: O projeto propõe transformar dados públicos já existentes em informação clara, acessível, e util para a sociedade. Por meio de um painel interativo organizado pelo município, a plataforma aproxima o cidadão dos dados do programa, facilita a compreensão de como os recursos são distribuídos e fortalece a transparência e o controle social. Além disso, é uma solução de baixo custo, pois utiliza a fonte de dados oficial e gratuita do Governo Federal	

3. # **Objetivos e critérios de sucesso do projeto** {#objetivos-e-critérios-de-sucesso-do-projeto}

Objetivos:  

1. Conectar a plataforma à API do Portal da Transparência para consultar os repasses de qualquer municípios pelo código do IBGE, com pelo menos 95% de sucesso nas requisições, até o 1º mês  
2. Criar um painel com no mínimo 4 indicadores e 3 tipos de gráficos, até o 2º  mês  
3. Permitir a exportação dos dados em PDF e CSV/Excel, até o 3º mês.   
4. Exibir as consultas em até 5 segundos, com layout adaptado para computador e celular, validado com pelo menos 10 usuários, até o 3º mês.   
5. Disponibilizar a plataforma online, com acesso público e gratuito, até o 4º mês. 

Critérios: 

1. Todos os objetivos acima forem entregues dentro do prazo e das restrições definidas;   
2. A plataforma exibir corretamente os dados de qualquer município brasileiro, com valores idênticos aos do Portal da Transparência;   
3. Pelo menos 80% dos usuários participantes dos testes avaliam a plataforma como fácil de usar e de entender;   
4. Os relatórios exportados forem gerados sem erros e com dados consistentes com o painel;   
5. Os critérios de aceitação das entregas, detalhados nas seções seguintes deste documento, foram aprovados pelas partes interessadas. 

4. # **Estrutura Analítica do Projeto – Fases e principais entregas** {#estrutura-analítica-do-projeto-–-fases-e-principais-entregas}

1. Iniciação    
   1. Termo de Abertura do Projeto   
      1. Elaborar Termo de Abertura do Projeto   
      2. Assinar Termo de Abertura do Projeto   
   2. Definição do Projeto   
      1. Definir objetivo   
      2. Levantar requisitos   
      3. Identificar partes interessadas   
      4. Definir Gerente do Projeto   
   3. Status Report 1   
      1. Elaborar Status Report 1   
      2. Apresentar Status Report 1 	  
2. Planejamento   
   1. Definição do Escopo    
      1. Definir as funcionalidades    
      2. Definir os dados que serão apresentados   
      3. Definir os limites do projeto  
      4. Definir requisitos não funcionais     
   2. Declaração do Escopo do Projeto    
      1. Elaborar Declaração do Escopo do Projeto   
      2. Assinar Declaração do Escopo do Projeto   
   3. Dicionário da EAP  
      1. Elaborar Dicionário da EAP   
      2. Assinar Dicionário da EAP   
   4. Plano de Gerenciamento   
      1. Elaborar Plano de Gerenciamento do Projeto   
      2. Assinar Plano de Gerenciamento do Projeto   
   5. Cronograma   
      1. Definir atividades   
      2. Sequenciar atividades   
      3. Estimar recursos   
      4. Estimar duração   
      5. Elaborar cronograma no Worklenz   
   6. Planejamento da Integração de Dados   
      1. Identificar API   
      2. Identificar dados do Bolsa Família   
      3. Definir código IBGE   
      4. Definir tratamento dos dados   
      5. Definir estratégia de cache e tratamento de erros da API (RNF01)   
      6.  Definir estratégia de cache e tratamento de erros da API (RNF01 e RNF02)  
   7. Status Report 2   
      1. Elaborar Status Report 2   
      2. Apresentar Status Report 2   
3. Execução   
   1. Módulo de Integração com API (Entrega 1\)   
      1. Configurar API (RF01)    
      2. Consulta por IBGE (RF01)   
      3. Tratamento dos dados (RF01)   
      4. Tratar erros de conexão, rate limit e indisponibilidade da API (RNF01)   
      5. Implementar armazenamento e cache dos dados extraídos (RNF02)   
   2. Dashboard (Entrega 2\)   
      1. Indicador de valor total por mês/ano (RF02)   
      2. Indicador de famílias beneficiadas por mês/ano (RF02)   
      3. Indicador de valor médio por mês/ano (RF02)   
      4. Gráficos de evolução com comparativo mês a mês e ano a ano (RF03)    
      5. Implementar design responsivo: desktop, tablet e smartphone (RNF03)   
      6. Aplicar diretrizes de acessibilidade eMAG/WCAG (RNF04)   
   3. Filtros (Entrega 3\)   
      1. Filtro por período (mês/ano) (RF04)   
      2. Filtro por município (RF04)   
   4. Relatórios/Exportação (Entrega 3\)   
      1. Exportar dados brutos e filtrados em CSV (RF05)   
      2. Exportar dados brutos e filtrados em JSON (RF05)   
      3. Gerar relatório consolidado em PDF para impressão/compartilhamento (RF06)   
   5. Publicação e Infraestrutura (Entrega 4\)    
      1. Configurar ambiente de produção/hospedagem   
      2. Publicar plataforma (deploy)   
      3. Apresentação pública   
      4. Interpretação dos dados (RF06)   
      5. Garantir conformidade com a LGPD: uso exclusivo de dados públicos (RNF09)   
      6. Configurar alta disponibilidade e suporte a acessos simultâneos (RNF06)   
   6. Testes    
      1. Testar funcionalidades (RF01 a RF06)    
      2. Testar desempenho: resposta das consultas \< 2 s (RNF05)   
      3. Testar carga e acessos simultâneos (RNF06)   
      4. Testar acessibilidade e responsividade (RNF03 e RNF04)   
      5. Corrigir problemas   
      6. Validar resultados   
   7. Documentação e Transparência Técnica (Entrega 5\)   
      1. Elaborar Manual do Usuário em linguagem simples (RNF07)   
      2. Documentar a arquitetura do sistema (RNF07)   
      3. Versionar o código-fonte em repositório público Open Source (RNF08)   
   8. Declaração de Trabalho   
      1. Elaborar Declaração de Trabalho   
      2. Assinar Declaração de Trabalho   
   9. Solicitação de Mudança   
      1. Elaborar Solicitação de Mudança quando necessária   
      2. Assinar Solicitação de Mudança   
   10. Status Report 3   
       1. Elaborar Status Report 3   
       2. Apresentar Status Report 3   
4. Monitoramento e Controle   
   1. Cronograma   
      1. Acompanhar cronograma   
      2. Atualizar Worklenz   
      3. Verificar atrasos   
   2. Controle das Entregas   
      1. Acompanhar entregas   
      2. Verificar requisitos funcionais e não funcionais   
      3. Registrar pendências   
   3. Monitoramento dos Riscos   
      1. Acompanhar riscos   
      2. Registrar novos riscos   
   4. Controle de Mudanças   
      1. Avaliar mudanças   
      2. Registrar mudanças aprovadas  
      3. Atualizar atividades  
   5. Status Report 4  
      1. Elaborar Status Report 4  
      2. Apresentar Status Report 4	   
5. Encerramento   
   1. Validação Final  
      1. Validar sistema  
      2. Obter aceite final  
   2. Transição do Produto   
      1. Elaborar documento de Transição do Produto  
      2. Entregar Manual do Usuário, documentação técnica e acesso ao repositório  
      3. Realizar transição		   
   3. Lições Aprendidas  
      1. Elaborar documento de Lições Aprendidas  
      2. Registrar lições  
   4. Relatório Final  
      1. Elaborar Relatório Final  
      2. Validar relatório  
   5. Apresentação Final  
      1. Preparar apresentação  
      2. Realizar apresentação  
   6. Encerramento  
      1. Verificar conclusão  
      2. Registrar encerramento

5. # **Principais requisitos das principais entregas/produtos**  {#principais-requisitos-das-principais-entregas/produtos}

| Entrega/Produto | Descrição da Entrega | Principais Requisitos apoiados |
| :---- | :---- | :---- |
| 1\. Módulo de Integração com API do Governo  | Componente do sistema responsável por se conectar ao Portal da Transparência do Governo Federal.  | **RF01:** O sistema deve consultar automaticamente os dados utilizando o código IBGE do município. o código IBGE do município. **RNF01:** O sistema deve realizar o tratamento de erros de conexão, de limite de requisições (rate limit) e de indisponibilidade da API externa. **RNF02:** O sistema deve realizar o armazenamento e o *caching* dos dados extraídos para otimizar o tempo de resposta do sistema. |
| 2\. Painel Interativo (Dashboard)  | Interface principal voltada para o cidadão, com foco na visualização clara dos dados de repasse.  | **RF02:** O sistema deve exibir indicadores-chave (mês/ano), incluindo o montante total repassado, o número total de famílias beneficiadas e o valor médio pago. **RF03:** O sistema deve apresentar gráficos dinâmicos de evolução temporal, permitindo o comparativo mês a mês e ano a ano. **RNF03:** A solução precisa apresentar layout adaptável, garantindo plena funcionalidade em computadores, dispositivos móveis e tablets. **RNF04:** A aplicação deverá estar em total alinhamento com os padrões normativos de acessibilidade digital (WCAG e eMAG). |
| 3\. Módulo de Relatórios e Exportação  | Funcionalidade que permite ao usuário baixar as informações detalhadas para análises próprias  | **RF04:** O sistema deve permitir que o usuário aplique filtros por período (mês/ano) e parâmetros do município. **RF05:** O sistema deve permitir a exportação dos dados brutos e filtrados em formatos abertos (CSV, JSON). **RF06:** O sistema deve gerar relatórios consolidados em formato PDF prontos para impressão ou compartilhamento.  |
| 4\. Plataforma Publicada e Infraestrutura  | Ambiente de produção onde a aplicação estará hospedada e acessível publicamente.  | **RNF05:** O sistema deve ter conformidade estrita com a LGPD, garantindo o uso exclusivo de dados públicos sem exposição indevida de dados sensíveis. **RNF06:** O sistema deve garantir um tempo de resposta das consultas do dashboard inferior a 2 segundos. **RNF07:** A plataforma deve possuir alta disponibilidade e capacidade de suporte a múltiplos acessos simultâneos. |
| 5\. Documentação e Transparência Técnica | Manual de apoio ao usuário e documentação técnica do sistema.  | **RNF08:** O projeto deve fornecer um Manual do Usuário explicativo com linguagem simples sobre como navegar e interpretar os gráficos. **RNF09:** O projeto deve manter a documentação da arquitetura do sistema e o código-fonte versionado em repositório público (*Open Source*). |

6. # **Marcos** {#marcos}

| Fase ou Grupo de Processos | Marcos | Previsão |
| :---- | :---- | :---- |
| Iniciação | Termo de Abertura do Projeto Aprovado  | 24/09/2026 |
| Planejamento | Arquitetura da Solução e Requisitos Definidos  | 24/09/2026 |
|  | Protótipo das Telas e Dashboards (UI/UX) Aprovado  | 8/10/2026 |
| Execução, Monitoramento e Controle | Entrega dos 4  Status Report Módulo de Integração com a API do Portal da Transparência Painel Interativo (Dashboard) e Gráficos Funcionalidade de Exportação de Relatórios Testes de Qualidade, Desempenho e Validação de Dados  Elaborar termo de abertura do projeto | 15/10/2026 |
| Apresentação | Plataforma Homologada e Publicada (Deploy em Produção)  | 22/10/2026 |
|  | Documentação Técnica e do Usuário Entregue Projeto Entregue e Encerrado  | 22/10/2026 |

7. # **Partes interessadas do projeto** {#partes-interessadas-do-projeto}

A tabela abaixo relaciona as principais partes interessadas do projeto:

| Empresa | Participante | Função |
| :---- | :---- | :---- |
| Unidavi | Prof. M.e Jullian Hermann Creutzberg  | Aprovar as principais entregas e decisões do projeto, como Termo de Abertura, escopo, protótipos e entrega final. Possui alta autoridade sobre o projeto. |
| Unidavi | Rafael Arthur de Lima da Silva | Organizar e distribuir as atividades, acompanhar prazos, atualizar o projeto no Worklenz, controlar o andamento das entregas e apresentar os Status Reports.  |
| Unidavi | Kauan Faust, Lucas Eduardo Demétrio, Leonardo Casa Nova, Guilherme Demarchi e Gabriel Sebold dos Santos | Planejamento, documentação, desenvolvimento, testes e entrega da aplicação conforme as atividades definidas na EAP. |
| Governo Federal / Portal da Transparência | Portal da Transparência | Disponibiliza a API utilizada pela aplicação. |
|  | Usuários da aplicação | Pessoas interessadas em consultar indicadores e informações sobre os recursos do Bolsa Família no município de Rio do Sul. |

8. # **Restrições** {#restrições}

* O Desenvolvimento e a documentação do projeto deverão ser concluídos até 22/10/2026, data prevista para encerramento, entrega e apresentação final.  
* A aplicação deverá possuir escopo simples, limitado a no máximo seis requisitos.  
* O sistema deverá obrigatoriamente utilizar API ou dados abertos públicos provenientes de portais oficiais de transparência.  
* O gerenciamento das atividades deverá ser realizado utilizando a ferramenta Worklenz, com acesso de todos os integrantes da equipe.  
* As funcionalidades e indicadores apresentados estarão limitados aos dados disponibilizados publicamente pela API do Portal da Transparência.

9. # **Premissas** {#premissas}

* A API de Dados Abertos do Portal da Transparência do Governo Federal continuará disponível, gratuita e sem restrições impeditivas para o projeto.  
* A estrutura de dados para envio e resposta da API não sofrerá alterações drásticas sem aviso prévio.  
* Os dados repassados pela API são precisos e atualizados regularmente pelo governo federal e possuem amparo legal para serem exibidos publicamente.  
* A equipe alocada possui conhecimento técnico suficiente para a realização do projeto e estará disponível conforme cronograma estipulado.

10. # **Riscos** {#riscos}

* O Portal da Transparência pode sofrer quedas frequentes ou lentidão, o que impediria a atualização dos dados na plataforma.  
* O alto volume de dados ao cruzar informações de municípios pode causar lentidão no carregamento de gráficos para o usuário final.  
* O Governo Federal decide fechar a API de Dados Abertos, mudar o método de autenticação exigindo CNPJs específicos, ou alterar completamente a chave de busca.  
* O programa social ser substituído por outro com regras e base de dados diferentes.




| Aprovações |  |  |
| ----- | ----- | ----- |
| **Participante** | **Assinatura** | **Data** |
| Patrocinador do Projeto | Jullian H. Creutzberg | 01/10/2026 |
| Gerente do Projeto | Rafael Arthur de Lima Silva | 01/10/2026 |

