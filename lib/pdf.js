import { custoProduto, fmt, getProdutos } from './db';

export async function exportarOrcamentoPDF(orcamento) {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const green = [15, 110, 86];
  const darkGreen = [8, 80, 65];
  const lightGreen = [225, 245, 238];

  // Header bar
  doc.setFillColor(...green);
  doc.rect(0, 0, W, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ORÇAMENTO DE FARDAMENTO', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data: ${orcamento.data || new Date().toLocaleDateString('pt-BR')}`, 14, 20);
  doc.text(`Nº ${orcamento.id || Date.now()}`, W - 14, 20, { align: 'right' });

  // Client info
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

  // Items table
  const produtos = getProdutos();
  const rows = (orcamento.itens || []).map(it => {
    const p = produtos.find(x => x.id === it.prodId);
    const cu = p ? custoProduto(p) : 0;
    const total = cu * (parseInt(it.qtd) || 0);
    return [
      it.nome,
      it.qtd,
      fmt(cu),
      fmt(total),
    ];
  });

  doc.autoTable({
    startY: 52,
    head: [['Produto', 'Qtd', 'Custo Unit.', 'Total Custo']],
    body: rows,
    headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [247, 252, 249] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    styles: { lineColor: [200, 230, 215], lineWidth: 0.3 },
  });

  const finalY = doc.lastAutoTable.finalY + 6;

  // Resumo financeiro
  const custoTotal = parseFloat(orcamento.custoTotal || 0);
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

  // Obs
  if (orcamento.obs) {
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Observações: ' + orcamento.obs, 18, finalY + 30);
  }

  // Footer
  doc.setFillColor(...green);
  doc.rect(0, 285, W, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Fardamento — Orçamento gerado automaticamente', W / 2, 292, { align: 'center' });

  doc.save(`orcamento_${orcamento.cliente || 'cliente'}_${Date.now()}.pdf`);
}
