// Banco de dados local (localStorage) + dados iniciais da planilha

export const MATERIAIS_BANCO = [
  { id: 1, nome: 'Jeans', valor: 16, medida: 'metro', rendimento: null, consumo: 1.3 },
  { id: 2, nome: 'Malha', valor: 32, medida: 'Kg', rendimento: 3, consumo: null },
  { id: 3, nome: 'Malha Piquet', valor: 52.9, medida: 'Kg', rendimento: 4, consumo: null },
  { id: 4, nome: 'Malha PP (Mavil)', valor: 39, medida: 'Kg', rendimento: 3, consumo: null },
  { id: 5, nome: 'Malha PP (Tico Malhas)', valor: 36, medida: 'Kg', rendimento: 3, consumo: null },
  { id: 6, nome: 'Malha PP (Laecio) (Dinheiro)', valor: 34, medida: 'Kg', rendimento: 3, consumo: null },
  { id: 7, nome: 'Malha PP (Costa Rica) (Dinheiro)', valor: 31, medida: 'Kg', rendimento: 3, consumo: null },
  { id: 8, nome: 'Grafil (camisa de tecido) ml', valor: 22, medida: 'metro', rendimento: null, consumo: 1.5 },
  { id: 9, nome: 'Grafil (camisa de tecido) mc', valor: 22, medida: 'metro', rendimento: null, consumo: 1.2 },
  { id: 10, nome: 'Faixa Refletiva cinza (2,5cm)', valor: 0.8, medida: 'metro', rendimento: null, consumo: null },
  { id: 11, nome: 'Faixa Refletiva neon (laranja)', valor: 2.5, medida: 'metro', rendimento: null, consumo: null },
  { id: 12, nome: 'Faixa Refletiva neon (verde)', valor: 2.5, medida: 'metro', rendimento: null, consumo: null },
  { id: 13, nome: 'Ribana (Punho e Gola)', valor: 53, medida: 'Kg', rendimento: 60, consumo: null },
  { id: 14, nome: 'Ribana Polo (Punho e Gola Polo)', valor: 5.55, medida: 'unidade', rendimento: 1, consumo: null },
  { id: 15, nome: 'Entretela', valor: 14, medida: 'metro', rendimento: 20, consumo: null },
  { id: 16, nome: 'Botão', valor: 0.04, medida: 'unidade', rendimento: 1, consumo: null },
  { id: 17, nome: 'Etiqueta', valor: 80, medida: 'milheiro', rendimento: 1000, consumo: null },
  { id: 18, nome: 'Bordado Simples', valor: 2.5, medida: 'peça', rendimento: 1, consumo: null },
];

export const SERVICOS_BANCO = [
  { id: 1, nome: 'Corte', valor: 1, medida: 'peça' },
  { id: 2, nome: 'Costura Calça', valor: 8, medida: 'peça' },
  { id: 3, nome: 'Costura Polo', valor: 8, medida: 'peça' },
  { id: 4, nome: 'Costura Camisa Básica', valor: 3.5, medida: 'peça' },
  { id: 5, nome: 'Costura Camisa de Tecido', valor: 18, medida: 'peça' },
  { id: 6, nome: 'Costura Bata de Brin', valor: 15, medida: 'peça' },
  { id: 7, nome: 'Costura Camisa manga longa capuz (com faixa)', valor: 4, medida: 'peça' },
  { id: 8, nome: 'Costura Camisa manga longa capuz', valor: 5, medida: 'peça' },
  { id: 9, nome: 'Pintura perna calça (-100)', valor: 2.5, medida: 'peça' },
  { id: 10, nome: 'Pintura perna calça (+100)', valor: 1, medida: 'peça' },
  { id: 11, nome: 'Pintura (+200) (1 cor)', valor: 2.5, medida: 'peça' },
  { id: 12, nome: 'Pintura (+100) (1 cor)', valor: 4, medida: 'peça' },
  { id: 13, nome: 'Pintura (-100) (1 cor)', valor: 6, medida: 'peça' },
  { id: 14, nome: 'Pintura (-100) (2 cor)', valor: 4.5, medida: 'peça' },
  { id: 15, nome: 'Gola e punho (Ribana)', valor: 5.55, medida: 'peça' },
  { id: 16, nome: 'Bordado peito', valor: 7.5, medida: 'peça' },
];

export const COLABORADORES_BANCO = [
  { id: 1, nome: 'Cruz', funcao: 'Costura camisa' },
  { id: 2, nome: 'Alves', funcao: 'Corte' },
  { id: 3, nome: 'Janaina', funcao: 'Costura calça' },
  { id: 4, nome: 'Paula', funcao: 'Costura malha' },
  { id: 5, nome: 'Gil', funcao: 'Pintura' },
];

/**
 * NOVO MODELO DE COMPOSIÇÃO DE CUSTOS
 *
 * Cada item em `custos` agora pode ser:
 *
 * a) Referência a material do banco:
 *    { tipo: 'material', refId: 4, nome: 'Malha PP (Mavil)', quantidade: 0.25,
 *      valorRef: 39, rendimento: 3 }
 *    → custo = (valorRef / rendimento) * quantidade
 *       = (39 / 3) * 0.25 = 3.25
 *
 * b) Referência a serviço do banco:
 *    { tipo: 'servico', refId: 3, nome: 'Costura Polo', quantidade: 1,
 *      valorRef: 8 }
 *    → custo = valorRef * quantidade = 8
 *
 * c) Item personalizado (digitado manualmente):
 *    { tipo: 'manual', nome: 'Frete especial', quantidade: 1, valorManual: 15 }
 *    → custo = valorManual * quantidade
 *
 * A função custoItem() calcula o custo de cada linha.
 * A função custoProduto() soma tudo + imposto.
 */

export function custoItem(c) {
  const qtd = parseFloat(c.quantidade) || 1;
  if (c.tipo === 'material') {
    const rend = parseFloat(c.rendimento) || 1;
    return (parseFloat(c.valorRef) / rend) * qtd;
  }
  if (c.tipo === 'servico') {
    return parseFloat(c.valorRef) * qtd;
  }
  // manual
  return (parseFloat(c.valorManual) || 0) * qtd;
}

export const PRODUTOS_INICIAIS = [
  {
    id: 1,
    nome: 'Camisa Polo',
    tipo: 'Camisa Polo',
    imposto: 0.07,
    custos: [
      { tipo: 'servico', refId: 3, nome: 'Costura Polo', quantidade: 1, valorRef: 8 },
      { tipo: 'material', refId: 14, nome: 'Ribana Polo (Punho e Gola Polo)', quantidade: 1, valorRef: 5.55, rendimento: 1 },
      { tipo: 'servico', refId: 16, nome: 'Bordado peito', quantidade: 1, valorRef: 7.5 },
      { tipo: 'material', refId: 4, nome: 'Malha PP (Mavil)', quantidade: 0.25, valorRef: 39, rendimento: 3 },
    ]
  },
  {
    id: 2,
    nome: 'Camisa Social',
    tipo: 'Camisa Social',
    imposto: 0.07,
    custos: [
      { tipo: 'servico', refId: 5, nome: 'Costura Camisa de Tecido', quantidade: 1, valorRef: 18 },
      { tipo: 'material', refId: 15, nome: 'Entretela', quantidade: 1, valorRef: 14, rendimento: 20 },
      { tipo: 'material', refId: 16, nome: 'Botão', quantidade: 6, valorRef: 0.04, rendimento: 1 },
      { tipo: 'material', refId: 18, nome: 'Bordado Simples', quantidade: 1, valorRef: 2.5, rendimento: 1 },
    ]
  },
];

const KEY_PRODUTOS = 'fard_produtos_v3';
const KEY_ORCAMENTOS = 'fard_orcamentos_v2';
const KEY_MATERIAIS = 'fard_materiais_v2';
const KEY_SERVICOS = 'fard_servicos_v2';
const KEY_COLABORADORES = 'fard_colaboradores_v2';

function load(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function save(key, data) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export function getProdutos() { return load(KEY_PRODUTOS, PRODUTOS_INICIAIS); }
export function saveProdutos(d) { save(KEY_PRODUTOS, d); }
export function getOrcamentos() { return load(KEY_ORCAMENTOS, []); }
export function saveOrcamentos(d) { save(KEY_ORCAMENTOS, d); }
export function getMateriais() { return load(KEY_MATERIAIS, MATERIAIS_BANCO); }
export function saveMateriais(d) { save(KEY_MATERIAIS, d); }
export function getServicos() { return load(KEY_SERVICOS, SERVICOS_BANCO); }
export function saveServicos(d) { save(KEY_SERVICOS, d); }
export function getColaboradores() { return load(KEY_COLABORADORES, COLABORADORES_BANCO); }
export function saveColaboradores(d) { save(KEY_COLABORADORES, d); }

export function custoProduto(p) {
  const subtotal = (p.custos || []).reduce((a, c) => a + custoItem(c), 0);
  const imp = subtotal * (parseFloat(p.imposto) || 0.07);
  return subtotal + imp;
}

export function fmt(v) {
  return 'R$ ' + parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
