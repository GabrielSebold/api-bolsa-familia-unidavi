# Primeira publicacao: API e painel no Render

Esta configuracao publica as funcionalidades existentes. Relatorios PDF continuam pendentes de integracao e aceite (RF06). Nenhum recurso externo foi criado por este guia.

## 1. Disponibilizar os arquivos no GitHub

Se voce tem permissao de escrita, use uma branch e um pull request no repositorio da equipe. Caso contrario, crie um fork no GitHub e envie suas alteracoes para ele. O Render deve apontar para o repositorio que contem render.yaml. Nao envie .env, chaves ou node_modules.

## 2. Criar os servicos

Acesse https://dashboard.render.com/ e escolha New > Blueprint. Conecte o repositorio e a branch corretos. O arquivo render.yaml descreve uma API Node e um painel estatico. Confira os custos exibidos antes de criar recursos: a API esta no plano free e nao tem alta disponibilidade.

O Blueprint solicita tres valores:

- PORTAL_TRANSPARENCIA_API_KEY: chave real do Portal da Transparencia. Somente na API; nunca use prefixo VITE_ para segredos.
- CORS_ORIGIN: origem HTTPS exata do painel, sem barra final (exemplo: https://bolsa-familia-painel.onrender.com).
- VITE_API_URL: URL publica HTTPS da API, sem barra final (exemplo: https://bolsa-familia-api.onrender.com).

As URLs acima sao exemplos. Apos a criacao, confira os enderecos realmente atribuidos pelo Render e corrija as duas variaveis, se necessario. Em seguida publique novamente os servicos. VITE_API_URL e incorporada durante o build: alterar a variavel exige novo build do painel.

O Render define PORT para a API; mantenha HOST=0.0.0.0. O Node esta fixado em 22.16.0, versao presente no ambiente local, para tornar a primeira validacao reproduzivel. Antes de uma producao definitiva, avaliar e testar atualizacao para uma versao LTS corrigida.

## 3. Conferir a publicacao

1. Aguarde os builds e os testes dos dois servicos terminarem.
2. Abra a URL da API seguida de /api/v1/saude. Confira status=ok e modo=real.
3. O modo real sozinho nao valida a chave: consulte um municipio e um mes com dados no painel e confira o resultado no Portal oficial.
4. Abra o painel e confira no navegador se as requisicoes apontam para a API HTTPS, sem localhost e sem erros de CORS.
5. Confira filtros, graficos, origem e data de coleta. Teste tambem uma consulta repetida para observar o cache.
6. Compartilhe a URL do painel. Registre PDF e RNF06 como pendentes; nao anuncie aceite completo da Entrega 4.

## 4. Atualizar quando os relatorios estiverem prontos

Integre o codigo pela branch conectada ao Render. Com a publicacao automatica habilitada, novos commits disparam outro deploy; os comandos de build executam os testes antes da publicacao. Nao e necessario recriar os servicos ou mudar as URLs. Se falhar, examine os logs e use o rollback do provedor quando disponivel.

O PDF deve usar os filtros e dados do painel e informar fonte, data da coleta, indicadores e graficos. Nao some familias entre meses como familias distintas; meses sem dados nao devem virar zero. Indique quando os dados sao ficticios ou vem de cache desatualizado.

## 5. Limites e evolucao para RNF06

O plano free suspende a API apos inatividade. O cache em /tmp e descartavel e pode desaparecer em reinicios e deploys; a aplicacao o recria, mas novas consultas dependem das fontes externas. Portanto nao ha garantia de resposta abaixo de dois segundos nem de alta disponibilidade nesta etapa.

Para atender RNF06, definir carga esperada e disponibilidade com a equipe; usar infraestrutura sem suspensao, instancias redundantes, balanceamento e monitoramento com alertas. Antes de replicar a API, adaptar o cache e o limite de chamadas externas para coordenacao compartilhada: hoje SQLite, fila e coalescencia sao locais a cada processo. Nao compartilhar o arquivo SQLite entre replicas. Um disco persistente isolado tambem nao resolve a redundancia.

Validar com testes de carga em cache frio e quente, registrando usuarios simultaneos, taxa de erros e tempos medio e p95; executar teste de falha de uma instancia. A rota de saude atual comprova que o processo responde, mas nao garante que o Portal esteja disponivel: monitorar tambem consultas reais e estado do circuito.

Para RNF09, manter indicadores agregados por municipio e periodo, proteger chaves e revisar logs de acesso, retencao e aviso de privacidade. Dados publicos nao dispensam a analise de finalidade e necessidade da LGPD.

## Referencias

- https://render.com/docs/blueprint-spec
- https://render.com/docs/static-sites
- https://render.com/docs/node-version
- https://render.com/docs/free
- https://render.com/docs/scaling
