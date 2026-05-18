// lib/db.js — banco de dados via Supabase com user_id em todos os inserts

import { supabase } from './supabase';

// ─── DADOS INICIAIS ───────────────────────────────────────────────────────────

export const MATERIAIS_BANCO = [
  { nome: 'Jeans', valor: 16, medida: 'metro', rendimento: null, consumo: 1.3 },
  { nome: 'Malha', valor: 32, medida: 'Kg', rendimento: 3, consumo: null },
  { nome: 'Malha Piquet', valor: 52.9, medida: 'Kg', rendimento: 4, consumo: null },
  { nome: 'Malha PP (Mavil)', valor: 39, medida: 'Kg', rendimento: 3, consumo: null },
  { nome: 'Malha PP (Tico Malhas)', valor: 36, medida: 'Kg', rendimento: 3, consumo: null },
  { nome: 'Malha PP (Laecio) (Dinheiro)', valor: 34, medida: 'Kg', rendimento: 3, consumo: null },
  { nome: 'Malha PP (Costa Rica) (Dinheiro)', valor: 31, medida: 'Kg', rendimento: 3, consumo: null },
  { nome: 'Grafil (camisa de tecido) ml', valor: 22, medida: 'metro', rendimento: null, consumo: 1.5 },
  { nome: 'Grafil (camisa de tecido) mc', valor: 22, medida: 'metro', rendimento: null, consumo: 1.2 },
  { nome: 'Faixa Refletiva cinza (2,5cm)', valor: 0.8, medida: 'metro', rendimento: null, consumo: null },
  { nome: 'Faixa Refletiva neon (laranja)', valor: 2.5, medida: 'metro', rendimento: null, consumo: null },
  { nome: 'Faixa Refletiva neon (verde)', valor: 2.5, medida: 'metro', rendimento: null, consumo: null },
  { nome: 'Ribana (Punho e Gola)', valor: 53, medida: 'Kg', rendimento: 60, consumo: null },
  { nome: 'Ribana Polo (Punho e Gola Polo)', valor: 5.55, medida: 'unidade', rendimento: 1, consumo: null },
  { nome: 'Entretela', valor: 14, medida: 'metro', rendimento: 20, consumo: null },
  { nome: 'Botão', valor: 0.04, medida: 'unidade', rendimento: 1, consumo: null },
  { nome: 'Etiqueta', valor: 80, medida: 'milheiro', rendimento: 1000, consumo: null },
  { nome: 'Bordado Simples', valor: 2.5, medida: 'peça', rendimento: 1, consumo: null },
];

export const SERVICOS_BANCO = [
  { nome: 'Corte', valor: 1, medida: 'peça' },
  { nome: 'Costura Calça', valor: 8, medida: 'peça' },
  { nome: 'Costura Polo', valor: 8, medida: 'peça' },
  { nome: 'Costura Camisa Básica', valor: 3.5, medida: 'peça' },
  { nome: 'Costura Camisa de Tecido', valor: 18, medida: 'peça' },
  { nome: 'Costura Bata de Brin', valor: 15, medida: 'peça' },
  { nome: 'Costura Camisa manga longa capuz (com faixa)', valor: 4, medida: 'peça' },
  { nome: 'Costura Camisa manga longa capuz', valor: 5, medida: 'peça' },
  { nome: 'Pintura perna calça (-100)', valor: 2.5, medida: 'peça' },
  { nome: 'Pintura perna calça (+100)', valor: 1, medida: 'peça' },
  { nome: 'Pintura (+200) (1 cor)', valor: 2.5, medida: 'peça' },
  { nome: 'Pintura (+100) (1 cor)', valor: 4, medida: 'peça' },
  { nome: 'Pintura (-100) (1 cor)', valor: 6, medida: 'peça' },
  { nome: 'Pintura (-100) (2 cor)', valor: 4.5, medida: 'peça' },
  { nome: 'Gola e punho (Ribana)', valor: 5.55, medida: 'peça' },
  { nome: 'Bordado peito', valor: 7.5, medida: 'peça' },
];

export const COLABORADORES_BANCO = [
  { nome: 'Cruz', funcao: 'Costura camisa' },
  { nome: 'Alves', funcao: 'Corte' },
  { nome: 'Janaina', funcao: 'Costura calça' },
  { nome: 'Paula', funcao: 'Costura malha' },
  { nome: 'Gil', funcao: 'Pintura' },
];

// ─── CÁLCULO ──────────────────────────────────────────────────────────────────

export function custoItem(c) {
  const qtd = parseFloat(c.quantidade) || 1;
  if (c.tipo === 'material') return (parseFloat(c.valorRef) / (parseFloat(c.rendimento) || 1)) * qtd;
  if (c.tipo === 'servico') return parseFloat(c.valorRef) * qtd;
  return (parseFloat(c.valorManual) || 0) * qtd;
}

export function custoProduto(p) {
  const subtotal = (p.custos || []).reduce((a, c) => a + custoItem(c), 0);
  if (p.usarImposto === false) return subtotal;
  return subtotal * (1 + (parseFloat(p.imposto) || 0.07));
}

export function fmt(v) {
  return 'R$ ' + parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── HELPER: pega user_id do usuário logado ───────────────────────────────────

async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Usuário não autenticado');
  return user.id;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUp(email, password, nome) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { nome } }
  });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

// ─── SEED ─────────────────────────────────────────────────────────────────────

export async function seedDadosIniciais(userId) {
  const { data: existing } = await supabase.from('materiais').select('id').limit(1);
  if (existing && existing.length > 0) return;
  const now = new Date().toISOString();
  await supabase.from('materiais').insert(MATERIAIS_BANCO.map(m => ({ ...m, user_id: userId, created_at: now, updated_at: now })));
  await supabase.from('servicos').insert(SERVICOS_BANCO.map(s => ({ ...s, user_id: userId, created_at: now, updated_at: now })));
  await supabase.from('colaboradores').insert(COLABORADORES_BANCO.map(c => ({ ...c, user_id: userId, created_at: now, updated_at: now })));
}

// ─── MATERIAIS ────────────────────────────────────────────────────────────────

export async function getMateriais() {
  const { data, error } = await supabase.from('materiais').select('*').order('nome');
  if (error) throw error;
  return data;
}

export async function saveMaterial(m) {
  const now = new Date().toISOString();
  const { id, user_id, ...rest } = m;
  if (id) {
    const { data, error } = await supabase.from('materiais').update({ ...rest, updated_at: now }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  } else {
    const uid = await getUserId();
    const { data, error } = await supabase.from('materiais').insert({ ...rest, user_id: uid, created_at: now, updated_at: now }).select().single();
    if (error) throw error;
    return data;
  }
}

export async function deleteMaterial(id) {
  const { error } = await supabase.from('materiais').delete().eq('id', id);
  if (error) throw error;
}

// ─── SERVIÇOS ─────────────────────────────────────────────────────────────────

export async function getServicos() {
  const { data, error } = await supabase.from('servicos').select('*').order('nome');
  if (error) throw error;
  return data;
}

export async function saveServico(s) {
  const now = new Date().toISOString();
  const { id, user_id, ...rest } = s;
  if (id) {
    const { data, error } = await supabase.from('servicos').update({ ...rest, updated_at: now }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  } else {
    const uid = await getUserId();
    const { data, error } = await supabase.from('servicos').insert({ ...rest, user_id: uid, created_at: now, updated_at: now }).select().single();
    if (error) throw error;
    return data;
  }
}

export async function deleteServico(id) {
  const { error } = await supabase.from('servicos').delete().eq('id', id);
  if (error) throw error;
}

// ─── PRODUTOS ─────────────────────────────────────────────────────────────────

export async function getProdutos() {
  const { data, error } = await supabase.from('produtos').select('*').order('nome');
  if (error) throw error;
  return data.map(p => ({ ...p, custos: p.custos || [] }));
}

export async function saveProduto(p) {
  const now = new Date().toISOString();
  const { id, user_id, ...rest } = p;
  if (id) {
    const { data, error } = await supabase.from('produtos').update({ ...rest, updated_at: now }).eq('id', id).select().single();
    if (error) throw error;
    return { ...data, custos: data.custos || [] };
  } else {
    const uid = await getUserId();
    const { data, error } = await supabase.from('produtos').insert({ ...rest, user_id: uid, created_at: now, updated_at: now }).select().single();
    if (error) throw error;
    return { ...data, custos: data.custos || [] };
  }
}

export async function deleteProduto(id) {
  const { error } = await supabase.from('produtos').delete().eq('id', id);
  if (error) throw error;
}

// ─── ORÇAMENTOS ───────────────────────────────────────────────────────────────

export async function getOrcamentos() {
  const { data, error } = await supabase.from('orcamentos').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(o => ({ ...o, itens: o.itens || [] }));
}

export async function saveOrcamento(o) {
  const now = new Date().toISOString();
  const { id, user_id, ...rest } = o;
  if (id) {
    const { data, error } = await supabase.from('orcamentos').update({ ...rest, updated_at: now }).eq('id', id).select().single();
    if (error) throw error;
    return { ...data, itens: data.itens || [] };
  } else {
    const uid = await getUserId();
    const { data, error } = await supabase.from('orcamentos').insert({ ...rest, user_id: uid, created_at: now, updated_at: now }).select().single();
    if (error) throw error;
    return { ...data, itens: data.itens || [] };
  }
}

export async function deleteOrcamento(id) {
  const { error } = await supabase.from('orcamentos').delete().eq('id', id);
  if (error) throw error;
}

// ─── COLABORADORES ────────────────────────────────────────────────────────────

export async function getColaboradores() {
  const { data, error } = await supabase.from('colaboradores').select('*').order('nome');
  if (error) throw error;
  return data;
}

export async function saveColaborador(c) {
  const now = new Date().toISOString();
  const { id, user_id, ...rest } = c;
  if (id) {
    const { data, error } = await supabase.from('colaboradores').update({ ...rest, updated_at: now }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  } else {
    const uid = await getUserId();
    const { data, error } = await supabase.from('colaboradores').insert({ ...rest, user_id: uid, created_at: now, updated_at: now }).select().single();
    if (error) throw error;
    return data;
  }
}

export async function deleteColaborador(id) {
  const { error } = await supabase.from('colaboradores').delete().eq('id', id);
  if (error) throw error;
}
