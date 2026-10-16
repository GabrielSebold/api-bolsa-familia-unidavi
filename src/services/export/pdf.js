const moeda = (n) => typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Não disponível';
const periodo = (m) => m ? `${m.slice(4, 6)}/${m.slice(0, 4)}` : '—';
const safe = (s) => String(s ?? '—').replace(/[^\x20-\xFF]/g, '?');
const hex = (s) => `<${Buffer.from(safe(s), 'latin1').toString('hex').toUpperCase()}>`;
const cor = { azul: '0.08 0.22 0.36', azul2: '0.12 0.34 0.52', claro: '0.91 0.95 0.98', tinta: '0.13 0.18 0.22', cinza: '0.38 0.44 0.49', linha: '0.83 0.87 0.90', branco: '1 1 1' };

function texto(s, x, y, size = 9, color = cor.tinta, bold = false) {
  return `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm ${hex(s)} Tj ET`;
}
const retangulo = (x, y, w, h, fill) => `${fill} rg ${x} ${y} ${w} ${h} re f`;
const linha = (x1, y1, x2, y2, color = cor.linha, width = 0.6) => `${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`;
const limitar = (s, max) => { const t = String(s ?? '—'); return t.length > max ? `${t.slice(0, max - 1)}…` : t; };

/** PDF A4 paisagem, vetorial, paginado e com cabeçalho repetido na tabela. */
export function gerarPDF({ dados, consulta, meta, escopo = 'bruto', geradoEm }) {
  const total = dados.reduce((s, r) => s + (Number.isFinite(r.valor) ? r.valor : 0), 0);
  const beneficiarios = dados.reduce((s, r) => s + (Number.isFinite(r.quantidadeBeneficiados) ? r.quantidadeBeneficiados : 0), 0);
  const meses = [...new Set(dados.map((r) => r.mesAno))].sort();
  const totaisMensais = new Map(meses.map((m) => [m, dados.filter((r) => r.mesAno === m).reduce((s, r) => s + (Number.isFinite(r.valor) ? r.valor : 0), 0)]));
  const maiorMes = Math.max(0, ...totaisMensais.values());
  const municipio = dados[0]?.municipio ?? 'Município sem registros';
  const uf = dados[0]?.uf ?? '—';
  const consultaPeriodo = consulta.mesAno ? periodo(consulta.mesAno) : `${periodo(consulta.de)} a ${periodo(consulta.ate)}`;
  const chunks = [];
  if (dados.length === 0) chunks.push([]);
  else {
    chunks.push(dados.slice(0, 12));
    for (let i = 12; i < dados.length; i += 22) chunks.push(dados.slice(i, i + 22));
  }

  const pageStreams = chunks.map((rows, pageIndex) => {
    const ops = [];
    if (pageIndex === 0) {
      ops.push(retangulo(0, 0, 842, 595, cor.branco), retangulo(0, 510, 842, 85, cor.azul));
      ops.push(texto('Relatório de Repasses do Bolsa Família', 38, 565, 19, cor.branco, true));
      ops.push(texto(`${municipio} - ${uf}   |   Código IBGE: ${consulta.codigoIbge}`, 40, 542, 10, cor.branco, true));
      ops.push(texto(`Período: ${consultaPeriodo}`, 40, 524, 9, cor.branco));
      ops.push(texto(`Gerado em: ${geradoEm}`, 560, 542, 8, cor.branco));
      ops.push(texto(`Origem: ${meta.origem}${meta.origem === 'mock' ? ' — DADOS SIMULADOS' : ''}`, 560, 524, 9, meta.origem === 'mock' ? '1 0.84 0.45' : cor.branco, true));
      ops.push(texto(`Escopo: ${escopo === 'bruto' ? 'DADOS BRUTOS DA SÉRIE COMPLETA' : 'DADOS FILTRADOS PELO PERÍODO SELECIONADO'}`, 40, 433, 8, cor.azul, true));

      const cards = [
        ['Total repassado', moeda(total)],
        ['Beneficiários somados por mês*', beneficiarios.toLocaleString('pt-BR')],
        ['Média por beneficiário-registro', beneficiarios ? moeda(total / beneficiarios) : 'Não disponível'],
        ['Registros incluídos', String(dados.length)],
      ];
      const cardY = 444; const cardW = 184; const gap = 14;
      cards.forEach(([label, value], i) => {
        const x = 38 + i * (cardW + gap);
        ops.push(retangulo(x, cardY, cardW, 52, cor.claro), texto(label, x + 10, cardY + 34, 8, cor.cinza, true), texto(value, x + 10, cardY + 13, 12, cor.azul, true));
      });
      if (meses.length > 1) {
        ops.push(texto('Evolução mensal dos valores repassados', 40, 422, 9, cor.azul, true));
        const chartX = 90; const chartY = 367; const chartW = 696; const chartH = 42;
        ops.push(linha(chartX, chartY, chartX + chartW, chartY, cor.cinza, 0.8));
        ops.push(texto('R$ 0', 38, chartY - 2, 6.5, cor.cinza), texto(moeda(maiorMes), 38, chartY + chartH - 1, 6.5, cor.cinza));
        const slot = chartW / meses.length; const barW = Math.max(3, Math.min(12, slot * 0.62));
        meses.forEach((m, i) => {
          const value = totaisMensais.get(m) ?? 0;
          const h = maiorMes ? Math.max(value > 0 ? 2 : 0, chartH * value / maiorMes) : 0;
          const x = chartX + i * slot + (slot - barW) / 2;
          if (h > 0) ops.push(retangulo(x, chartY, barW, h, cor.azul2));
          if (i % Math.max(1, Math.ceil(meses.length / 10)) === 0 || i === meses.length - 1) ops.push(texto(periodo(m), x - 4, chartY - 13, 6.5, cor.cinza));
        });
      }
      ops.push(texto('Detalhamento dos repasses', 40, 342, 11, cor.azul, true));
      ops.push(texto('*Beneficiários somados por registro mensal; não representa pessoas únicas.', 40, 328, 7.5, cor.cinza));
    } else {
      ops.push(retangulo(0, 0, 842, 595, cor.branco), retangulo(0, 535, 842, 60, cor.azul));
      ops.push(texto('Relatório de Repasses do Bolsa Família', 38, 565, 15, cor.branco, true));
      ops.push(texto(`${municipio} - ${uf}   |   Código IBGE: ${consulta.codigoIbge}   |   Período: ${consultaPeriodo}`, 40, 544, 9, cor.branco));
    }

    const startY = pageIndex === 0 ? 306 : 518;
    const tableHeaderH = 20;
    ops.push(retangulo(38, startY - tableHeaderH + 3, 766, tableHeaderH, cor.azul2));
    const cols = [40, 120, 405, 535, 670];
    const heads = ['Mês/ano', 'Tipo de benefício', 'Valor repassado', 'Beneficiários', 'Valor médio'];
    heads.forEach((h, i) => ops.push(texto(h, cols[i], startY - 10, 8, cor.branco, true)));
    const rowH = 18;
    rows.forEach((r, i) => {
      const y = startY - tableHeaderH - (i + 1) * rowH + 6;
      if (i % 2 === 0) ops.push(retangulo(38, y - 4, 766, rowH, '0.96 0.97 0.98'));
      const cells = [periodo(r.mesAno), limitar(r.tipo?.descricao, 46), moeda(r.valor), r.quantidadeBeneficiados?.toLocaleString('pt-BR') ?? '—', moeda(r.valorMedio)];
      cells.forEach((cell, j) => ops.push(texto(cell, cols[j], y + 2, 7.5, cor.tinta)));
      ops.push(linha(38, y - 4, 804, y - 4));
    });
    if (dados.length === 0) ops.push(texto('Nenhum registro disponível.', 42, startY - 43, 9, cor.cinza));
    const footerText = `Relatório gerado em ${geradoEm}   |   Página ${pageIndex + 1} de ${chunks.length}`;
    ops.push(linha(38, 35, 804, 35), texto(footerText, 40, 21, 7.5, cor.cinza));
    return ops.join('\n');
  });

  const objects = [null];
  const add = (value) => { objects.push(value); return objects.length - 1; };
  const catalogId = add(''); const pagesId = add('');
  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const boldId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const pageIds = [];
  for (const stream of pageStreams) {
    const contentId = add(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldId} 0 R >> >> /Contents ${contentId} 0 R >>`));
  }
  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let pdf = '%PDF-1.4\n%âãÏÓ\n'; const offsets = [0];
  for (let i = 1; i < objects.length; i++) { offsets[i] = Buffer.byteLength(pdf, 'latin1'); pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`; }
  const xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}
