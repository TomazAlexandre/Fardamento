import { custoProduto, fmt } from './db';

export async function exportarOrcamentoPDF(orcamento, produtos = []) {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const green = [15, 110, 86];
  const darkGreen = [8, 80, 65];
  const lightGreen = [225, 245, 238];

  doc.setFillColor(...green);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ORÇAMENTO DE FARDAMENTO', 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data: ${orcamento.data || new Date().toLocaleDateString('pt-BR')}`, 14, 20);
  doc.text(`Nº ${String(orcamento.id || '').slice(0, 8).toUpperCase()}`, W - 14, 20, { align: 'right' });

  doc.setFillColor(...lightGreen);
  doc.rect(14, 32, W - 28, 14, 'F');
  doc.setTextColor(...darkGreen);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', 18, 38);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.text(orcamento.cliente || '—', 18, 43);

  const rows = (orcamento.itens || []).map(it => {
    const p = produtos.find(x => x.id === it.prodId);
    const cu = p ? custoProduto(p) : (it.custo_unit || 0);
    return [it.nome, String(it.qtd), fmt(cu), fmt(cu * (parseInt(it.qtd) || 0))];
  });

  doc.autoTable({
    startY: 52,
    head: [['Produto', 'Qtd', 'Custo Unit.', 'Total Custo']],
    body: rows,
    headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [247, 252, 249] },
    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 40, halign: 'right' }, 3: { cellWidth: 40, halign: 'right' } },
    margin: { left: 14, right: 14 },
    styles: { lineColor: [200, 230, 215], lineWidth: 0.3 },
  });

  const finalY = doc.lastAutoTable.finalY + 6;
  const custoTotal = parseFloat(orcamento.custo_total || orcamento.custoTotal || 0);
  const venda = parseFloat(orcamento.venda || 0);
  const lucro = venda - custoTotal;
  const roi = custoTotal > 0 ? (lucro / custoTotal * 100) : 0;

  doc.setFillColor(...lightGreen);
  doc.rect(14, finalY, W - 28, 38, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkGreen);
  doc.text('RESUMO FINANCEIRO', 18, finalY + 6);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  const col1x = 18, col2x = 100;
  doc.text('Custo interno total:', col1x, finalY + 14);
  doc.setFont('helvetica', 'bold');
  doc.text(fmt(custoTotal), col1x + 50, finalY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text('Valor de venda:', col1x, finalY + 21);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...green);
  doc.text(fmt(venda), col1x + 50, finalY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text('Lucro líquido:', col2x, finalY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(lucro >= 0 ? 15 : 200, lucro >= 0 ? 110 : 60, lucro >= 0 ? 86 : 60);
  doc.text(fmt(lucro), col2x + 40, finalY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text('ROI:', col2x, finalY + 21);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...green);
  doc.text(`${roi.toFixed(1)}%`, col2x + 40, finalY + 21);

  if (orcamento.obs) {
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Observações: ' + orcamento.obs, 18, finalY + 30);
  }

  doc.setFillColor(...green);
  doc.rect(0, 285, W, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('FardaMais Uniformes — Orçamento gerado automaticamente', W / 2, 292, { align: 'center' });
  doc.save(`orcamento_${orcamento.cliente || 'cliente'}_${Date.now()}.pdf`);
}

export async function exportarProtocoloPDF(orcamento) {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const green = [15, 110, 86];
  const darkGreen = [8, 80, 65];
  const lightGreen = [225, 245, 238];

  // Cabeçalho
  doc.setFillColor(...green);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PROTOCOLO DE ENTREGA DE FARDAMENTO', W / 2, 12, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('FardaMais Uniformes  |  Documento de Controle Interno', W / 2, 21, { align: 'center' });

  // Nº e data
  doc.setFillColor(...lightGreen);
  doc.rect(14, 34, W - 28, 10, 'F');
  doc.setTextColor(...darkGreen);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const numProtocolo = String(orcamento.id || '').slice(0, 8).toUpperCase();
  const dataFormatada = orcamento.data
    ? new Date(orcamento.data + 'T12:00:00').toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  doc.text(`Nº do Protocolo: ${numProtocolo}`, 18, 40);
  doc.text(`Data: ${dataFormatada}`, W - 18, 40, { align: 'right' });

  // Seção 1: Dados da empresa
  let y = 50;
  sectionTitle(doc, '1. DADOS DA EMPRESA RECEPTORA', y, green);
  y += 8;

  const de = orcamento.dadosEmpresa || {};
  const campos = [
    ['Razão Social', de.razaoSocial || orcamento.cliente || ''],
    ['CNPJ', de.cnpj || ''],
    ['Endereço', de.endereco || ''],
    ['Cidade / UF', de.cidade || ''],
    ['Responsável', de.responsavel || ''],
    ['Cargo', de.cargo || ''],
    ['Telefone', de.telefone || ''],
    ['E-mail', de.email || ''],
  ];
  campos.forEach(([label, val]) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGreen);
    doc.text(label + ':', 16, y);
    doc.setDrawColor(180, 210, 195);
    doc.setLineWidth(0.3);
    doc.line(16, y + 1, W - 16, y + 1);
    if (val) { doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40); doc.text(val, 55, y); }
    y += 7;
  });

  // Seção 2: Itens
  y += 2;
  sectionTitle(doc, '2. ITENS DE FARDAMENTO ENTREGUES', y, green);
  y += 4;

  const itensRows = (orcamento.itens || []).map((it, i) => [
    String(i + 1), it.nome || '', it.tamanho || '', String(it.qtd || ''), it.cor || '', it.obs_entrega || '',
  ]);
  while (itensRows.length < 10) { itensRows.push([String(itensRows.length + 1), '', '', '', '', '']); }

  doc.autoTable({
    startY: y,
    head: [['Nº', 'Descrição do Item', 'Tamanho', 'Qtd.', 'Cor', 'Observação']],
    body: itensRows,
    headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40], minCellHeight: 7 },
    alternateRowStyles: { fillColor: [247, 252, 249] },
    columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 65 }, 2: { cellWidth: 22, halign: 'center' }, 3: { cellWidth: 15, halign: 'center' }, 4: { cellWidth: 25, halign: 'center' }, 5: { cellWidth: 45 } },
    margin: { left: 14, right: 14 },
    styles: { lineColor: [200, 230, 215], lineWidth: 0.3 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // Seção 3: Declaração
  if (y > 220) { doc.addPage(); y = 20; }
  sectionTitle(doc, '3. DECLARAÇÃO DE RECEBIMENTO', y, green);
  y += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const decl = 'Declaro que recebi os itens de fardamento listados acima em perfeitas condições, conferidos e aprovados pelo responsável da empresa identificada neste protocolo. Os itens foram entregues conforme especificações acordadas.';
  const lines = doc.splitTextToSize(decl, W - 28);
  doc.text(lines, 14, y);
  y += lines.length * 5 + 6;

  // Assinaturas
  const assinW = (W - 38) / 2;
  const assinX1 = 14, assinX2 = 14 + assinW + 10;
  doc.setDrawColor(...green);
  doc.setLineWidth(0.4);
  doc.rect(assinX1, y, assinW, 28);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGreen);
  doc.text('Responsável pela Entrega', assinX1 + assinW / 2, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Nome: ___________________________', assinX1 + 4, y + 14);
  doc.text('Cargo: ___________________________', assinX1 + 4, y + 21);
  doc.rect(assinX2, y, assinW, 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGreen);
  doc.text('Responsável pelo Recebimento', assinX2 + assinW / 2, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Nome: ___________________________', assinX2 + 4, y + 14);
  doc.text('Cargo: ___________________________', assinX2 + 4, y + 21);
  y += 34;

  // Seção 4: Observações
  if (y > 255) { doc.addPage(); y = 20; }
  sectionTitle(doc, '4. OBSERVAÇÕES GERAIS', y, green);
  y += 5;
  doc.setDrawColor(180, 210, 195);
  doc.setLineWidth(0.3);
  doc.rect(14, y, W - 28, 18);
  if (orcamento.obs) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(orcamento.obs, 17, y + 6);
  }

  // Rodapé
  doc.setFillColor(...green);
  doc.rect(0, 285, W, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('FardaMais Uniformes  |  Via original: Empresa Fornecedora  |  Via cópia: Empresa Receptora', W / 2, 292, { align: 'center' });
  doc.save(`protocolo_${orcamento.cliente || 'cliente'}_${numProtocolo}.pdf`);
}

function sectionTitle(doc, text, y, color) {
  doc.setFillColor(...color);
  doc.rect(14, y - 1, 182, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(text, 16, y + 3.5);
}
