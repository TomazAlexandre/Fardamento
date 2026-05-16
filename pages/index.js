import { useState, useEffect } from 'react';
import {
  getProdutos, saveProdutos, getOrcamentos, saveOrcamentos,
  getMateriais, saveMateriais, getServicos, saveServicos,
  getColaboradores, saveColaboradores,
  custoProduto, custoItem, fmt,
  MATERIAIS_BANCO, SERVICOS_BANCO, COLABORADORES_BANCO
} from '../lib/db';

export default function Home() {
  const [tab, setTab] = useState('orcamento');
  const [produtos, setProdutos] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);

  useEffect(() => {
    setProdutos(getProdutos());
    setOrcamentos(getOrcamentos());
    setMateriais(getMateriais());
    setServicos(getServicos());
    setColaboradores(getColaboradores());
  }, []);

  const tabs = [
    { id: 'orcamento', label: '📋 Orçamento' },
    { id: 'produtos', label: '👕 Produtos' },
    { id: 'materiais', label: '🧵 Materiais' },
    { id: 'historico', label: '📁 Histórico' },
    { id: 'colaboradores', label: '👥 Equipe' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Sistema de Fardamento</h1>
            <p className="text-xs text-gray-400">Gestão de custos e orçamentos</p>
          </div>
          <div className="flex gap-1 flex-wrap">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'orcamento' && <OrcamentoTab produtos={produtos} orcamentos={orcamentos} setOrcamentos={v => { setOrcamentos(v); saveOrcamentos(v); }} />}
        {tab === 'produtos' && (
          <ProdutosTab
            produtos={produtos}
            setProdutos={v => { setProdutos(v); saveProdutos(v); }}
            materiais={materiais}
            servicos={servicos}
          />
        )}
        {tab === 'materiais' && <MateriaisTab materiais={materiais} setMateriais={v => { setMateriais(v); saveMateriais(v); }} servicos={servicos} setServicos={v => { setServicos(v); saveServicos(v); }} />}
        {tab === 'historico' && <HistoricoTab orcamentos={orcamentos} setOrcamentos={v => { setOrcamentos(v); saveOrcamentos(v); }} produtos={produtos} />}
        {tab === 'colaboradores' && <ColaboradoresTab colaboradores={colaboradores} setColaboradores={v => { setColaboradores(v); saveColaboradores(v); }} />}
      </main>
    </div>
  );
}

// ─── ORÇAMENTO ───────────────────────────────────────────────────────────────
function OrcamentoTab({ produtos, orcamentos, setOrcamentos }) {
  const [cliente, setCliente] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [obs, setObs] = useState('');
  const [itens, setItens] = useState([]);
  const [selProd, setSelProd] = useState('');
  const [venda, setVenda] = useState('');

  const custoTotal = itens.reduce((a, it) => {
    const p = produtos.find(x => x.id === it.prodId);
    return a + (p ? custoProduto(p) * (parseInt(it.qtd) || 0) : 0);
  }, 0);
  const lucro = (parseFloat(venda) || 0) - custoTotal;

  function addItem() {
    const id = parseInt(selProd);
    if (!id) return;
    const p = produtos.find(x => x.id === id);
    if (!p) return;
    const existe = itens.find(x => x.prodId === id);
    if (existe) {
      setItens(itens.map(x => x.prodId === id ? { ...x, qtd: x.qtd + 1 } : x));
    } else {
      setItens([...itens, { prodId: p.id, nome: p.nome, qtd: 1 }]);
    }
  }

  async function exportarPDF() {
    if (!cliente.trim() || !itens.length) { alert('Preencha cliente e adicione itens.'); return; }
    const orc = { id: Date.now(), cliente, data, obs, itens, custoTotal, venda: parseFloat(venda) || 0, lucro };
    const { exportarOrcamentoPDF } = await import('../lib/pdf');
    await exportarOrcamentoPDF(orc);
  }

  function salvar() {
    if (!cliente.trim()) { alert('Informe o cliente'); return; }
    if (!itens.length) { alert('Adicione pelo menos um item'); return; }
    const orc = { id: Date.now(), cliente, data, obs, itens: [...itens], custoTotal, venda: parseFloat(venda) || 0, lucro };
    setOrcamentos([orc, ...orcamentos]);
    setCliente(''); setItens([]); setVenda(''); setObs('');
    alert('Orçamento salvo!');
  }

  return (
    <div className="space-y-4">
      <Card title="Dados do Pedido">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cliente">
            <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nome do cliente" className={inp} />
          </Field>
          <Field label="Data">
            <input type="date" value={data} onChange={e => setData(e.target.value)} className={inp} />
          </Field>
        </div>
        <Field label="Observações" className="mt-3">
          <input value={obs} onChange={e => setObs(e.target.value)} placeholder="Observações para o orçamento..." className={inp} />
        </Field>
      </Card>

      <Card title="Itens do Pedido">
        <div className="flex gap-2 mb-4">
          <select value={selProd} onChange={e => setSelProd(e.target.value)} className={`${inp} flex-1`}>
            <option value="">Selecionar produto...</option>
            {produtos.map(p => (
              <option key={p.id} value={p.id}>{p.nome} — {fmt(custoProduto(p))}</option>
            ))}
          </select>
          <button onClick={addItem} className={btnPrimary}>+ Adicionar</button>
        </div>

        {itens.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhum item adicionado</p>}
        <div className="space-y-2">
          {itens.map((it, i) => {
            const p = produtos.find(x => x.id === it.prodId);
            const cu = p ? custoProduto(p) : 0;
            return (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <span className="flex-1 text-sm font-medium text-gray-800">{it.nome}</span>
                <span className="text-xs text-gray-400 w-24">Unit: {fmt(cu)}</span>
                <input type="number" min="1" value={it.qtd}
                  onChange={e => setItens(itens.map((x, j) => j === i ? { ...x, qtd: parseInt(e.target.value) || 1 } : x))}
                  className="w-16 text-center border border-gray-200 rounded-md py-1 text-sm" />
                <span className="text-sm font-semibold text-emerald-700 w-20 text-right">{fmt(cu * it.qtd)}</span>
                <button onClick={() => setItens(itens.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Resumo Financeiro">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Metric label="Custo interno" value={fmt(custoTotal)} color="text-emerald-700" />
          <Metric label="Valor de venda" value={fmt(parseFloat(venda) || 0)} color="text-blue-700" />
          <Metric label="Lucro" value={fmt(lucro)} color={lucro >= 0 ? 'text-emerald-700' : 'text-red-600'} />
        </div>
        <Field label="Preço de venda ao cliente (você define)">
          <input type="number" step="0.01" value={venda} onChange={e => setVenda(e.target.value)}
            placeholder="0,00" className={`${inp} text-lg font-semibold`} />
        </Field>
      </Card>

      <div className="flex gap-3 justify-end">
        <button onClick={() => { setItens([]); setVenda(''); setCliente(''); }} className={btnSecondary}>Limpar</button>
        <button onClick={exportarPDF} className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
          📄 Exportar PDF
        </button>
        <button onClick={salvar} className={btnPrimary}>✓ Salvar Orçamento</button>
      </div>
    </div>
  );
}

// ─── PRODUTOS ────────────────────────────────────────────────────────────────
function ProdutosTab({ produtos, setProdutos, materiais, servicos }) {
  const [form, setForm] = useState(null);
  // 'banco' = selecionar do banco | 'manual' = digitar livre
  const [addMode, setAddMode] = useState(null);
  // estado temporário do item sendo adicionado via banco
  const [itemBanco, setItemBanco] = useState({ tipo: 'servico', refId: '', quantidade: 1 });

  function openNovo() {
    setForm({ nome: '', tipo: 'Camisa Polo', imposto: 7, custos: [] });
    setAddMode(null);
  }
  function openEditar(p) {
    setForm({ ...p, imposto: (p.imposto || 0.07) * 100, custos: p.custos.map(c => ({ ...c })) });
    setAddMode(null);
  }
  function salvar() {
    if (!form.nome.trim()) { alert('Informe o nome'); return; }
    const p = { ...form, imposto: (parseFloat(form.imposto) || 7) / 100 };
    if (p.id) {
      setProdutos(produtos.map(x => x.id === p.id ? p : x));
    } else {
      setProdutos([...produtos, { ...p, id: Date.now() }]);
    }
    setForm(null);
    setAddMode(null);
  }
  function excluir(id) {
    if (!confirm('Excluir produto?')) return;
    setProdutos(produtos.filter(p => p.id !== id));
  }

  // Confirma adição do item do banco
  function confirmarItemBanco() {
    const refId = parseInt(itemBanco.refId);
    if (!refId) { alert('Selecione um item'); return; }
    const qtd = parseFloat(itemBanco.quantidade) || 1;

    let novoItem;
    if (itemBanco.tipo === 'material') {
      const m = materiais.find(x => x.id === refId);
      if (!m) return;
      novoItem = {
        tipo: 'material',
        refId: m.id,
        nome: m.nome,
        quantidade: qtd,
        valorRef: parseFloat(m.valor),
        rendimento: parseFloat(m.rendimento) || 1,
        medida: m.medida,
      };
    } else {
      const s = servicos.find(x => x.id === refId);
      if (!s) return;
      novoItem = {
        tipo: 'servico',
        refId: s.id,
        nome: s.nome,
        quantidade: qtd,
        valorRef: parseFloat(s.valor),
        medida: s.medida,
      };
    }

    setForm({ ...form, custos: [...form.custos, novoItem] });
    setItemBanco({ tipo: 'servico', refId: '', quantidade: 1 });
    setAddMode(null);
  }

  // Adiciona item manual
  function confirmarItemManual() {
    setForm({
      ...form,
      custos: [...form.custos, { tipo: 'manual', nome: '', quantidade: 1, valorManual: '' }]
    });
    setAddMode(null);
  }

  // Atualiza campo de um custo existente
  function updateCusto(i, campo, valor) {
    setForm({
      ...form,
      custos: form.custos.map((c, j) => j === i ? { ...c, [campo]: valor } : c)
    });
  }

  const subtotal = form ? form.custos.reduce((a, c) => a + custoItem(c), 0) : 0;

  // Lista combinada para o seletor do banco
  const listaBanco = itemBanco.tipo === 'material' ? materiais : servicos;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold text-gray-900">Produtos Cadastrados</h2>
        <button onClick={openNovo} className={btnPrimary}>+ Novo Produto</button>
      </div>

      {form && (
        <Card title={form.id ? `Editando: ${form.nome}` : 'Novo Produto'}>
          {/* Campos base */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Nome">
              <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className={inp} placeholder="Nome do produto" />
            </Field>
            <Field label="Tipo">
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className={inp}>
                {['Camisa Polo', 'Camisa Social', 'Camiseta', 'Jaleco', 'Bermuda', 'Calça', 'Outro'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Imposto NF (%)">
            <input type="number" value={form.imposto} onChange={e => setForm({ ...form, imposto: e.target.value })} className={`${inp} w-32`} />
          </Field>

          {/* Composição */}
          <div className="mt-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-800">Composição de Custos</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setAddMode(addMode === 'banco' ? null : 'banco')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${addMode === 'banco' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
                >
                  🧵 Do banco
                </button>
                <button
                  onClick={() => {
                    setAddMode(null);
                    setForm({ ...form, custos: [...form.custos, { tipo: 'manual', nome: '', quantidade: 1, valorManual: '' }] });
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  ✏️ Manual
                </button>
              </div>
            </div>

            {/* Painel seleção do banco */}
            {addMode === 'banco' && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs font-semibold text-emerald-800 mb-2">Adicionar do banco</p>
                <div className="grid grid-cols-3 gap-2">
                  {/* Tipo: material ou serviço */}
                  <Field label="Tipo">
                    <select
                      value={itemBanco.tipo}
                      onChange={e => setItemBanco({ tipo: e.target.value, refId: '', quantidade: 1 })}
                      className={inp}
                    >
                      <option value="servico">🪡 Serviço</option>
                      <option value="material">🧵 Material</option>
                    </select>
                  </Field>

                  {/* Item do banco */}
                  <Field label={itemBanco.tipo === 'material' ? 'Material' : 'Serviço'}>
                    <select
                      value={itemBanco.refId}
                      onChange={e => setItemBanco({ ...itemBanco, refId: e.target.value })}
                      className={inp}
                    >
                      <option value="">Selecione...</option>
                      {listaBanco.map(x => {
                        const rend = itemBanco.tipo === 'material' && x.rendimento
                          ? ` (rend. ${x.rendimento})`
                          : '';
                        return (
                          <option key={x.id} value={x.id}>
                            {x.nome} — {fmt(x.valor)}/{x.medida}{rend}
                          </option>
                        );
                      })}
                    </select>
                  </Field>

                  {/* Quantidade */}
                  <Field label={itemBanco.tipo === 'material' ? 'Quantidade (Kg/m/un)' : 'Quantidade (peças)'}>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={itemBanco.quantidade}
                      onChange={e => setItemBanco({ ...itemBanco, quantidade: e.target.value })}
                      className={inp}
                    />
                  </Field>
                </div>

                {/* Preview do custo */}
                {itemBanco.refId && (() => {
                  const item = listaBanco.find(x => x.id === parseInt(itemBanco.refId));
                  if (!item) return null;
                  const qtd = parseFloat(itemBanco.quantidade) || 1;
                  let custo, formula;
                  if (itemBanco.tipo === 'material') {
                    const rend = parseFloat(item.rendimento) || 1;
                    custo = (item.valor / rend) * qtd;
                    formula = `${fmt(item.valor)} ÷ ${rend} × ${qtd} = ${fmt(custo)}`;
                  } else {
                    custo = item.valor * qtd;
                    formula = `${fmt(item.valor)} × ${qtd} = ${fmt(custo)}`;
                  }
                  return (
                    <div className="mt-2 flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-emerald-200">
                      <span className="text-xs text-gray-500 font-mono">{formula}</span>
                      <span className="text-sm font-semibold text-emerald-700">{fmt(custo)}</span>
                    </div>
                  );
                })()}

                <div className="flex gap-2 justify-end mt-2">
                  <button onClick={() => setAddMode(null)} className={btnSecondary + ' text-xs py-1 px-3'}>Cancelar</button>
                  <button onClick={confirmarItemBanco} className={btnPrimary + ' text-xs py-1 px-3'}>+ Adicionar</button>
                </div>
              </div>
            )}

            {/* Lista de itens da composição */}
            {form.custos.length === 0 && addMode !== 'banco' && (
              <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
                Clique em "🧵 Do banco" ou "✏️ Manual" para adicionar itens
              </p>
            )}

            <div className="space-y-2">
              {/* Header */}
              {form.custos.length > 0 && (
                <div className="grid grid-cols-12 gap-2 px-1 mb-1">
                  <span className="col-span-5 text-xs font-medium text-gray-400 uppercase tracking-wide">Item</span>
                  <span className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wide text-center">Qtd</span>
                  <span className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wide text-right">Valor unit.</span>
                  <span className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wide text-right">Custo</span>
                  <span className="col-span-1"></span>
                </div>
              )}

              {form.custos.map((c, i) => {
                const custo = custoItem(c);
                const badge = c.tipo === 'material'
                  ? 'bg-blue-50 text-blue-600'
                  : c.tipo === 'servico'
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-gray-100 text-gray-500';
                const badgeLabel = c.tipo === 'material' ? 'material' : c.tipo === 'servico' ? 'serviço' : 'manual';

                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg px-2 py-2">
                    {/* Nome */}
                    <div className="col-span-5 flex items-center gap-1.5 min-w-0">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge}`}>{badgeLabel}</span>
                      {c.tipo === 'manual' ? (
                        <input
                          value={c.nome}
                          onChange={e => updateCusto(i, 'nome', e.target.value)}
                          placeholder="Nome do item..."
                          className="text-xs border border-gray-200 rounded px-2 py-1 flex-1 min-w-0 bg-white"
                        />
                      ) : (
                        <span className="text-xs font-medium text-gray-800 truncate">{c.nome}</span>
                      )}
                    </div>

                    {/* Quantidade */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={c.quantidade}
                        onChange={e => updateCusto(i, 'quantidade', parseFloat(e.target.value) || 1)}
                        className="w-full text-center text-xs border border-gray-200 rounded-md py-1 bg-white"
                      />
                    </div>

                    {/* Valor unitário — editável só no manual */}
                    <div className="col-span-2 text-right">
                      {c.tipo === 'manual' ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={c.valorManual}
                          onChange={e => updateCusto(i, 'valorManual', e.target.value)}
                          placeholder="0,00"
                          className="w-full text-right text-xs border border-gray-200 rounded-md py-1 bg-white"
                        />
                      ) : (
                        <span className="text-xs text-gray-500">
                          {c.tipo === 'material'
                            ? `${fmt(c.valorRef)}/${c.medida}÷${c.rendimento}`
                            : fmt(c.valorRef)}
                        </span>
                      )}
                    </div>

                    {/* Custo calculado */}
                    <div className="col-span-2 text-right">
                      <span className="text-sm font-semibold text-emerald-700">{fmt(custo)}</span>
                    </div>

                    {/* Remover */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => setForm({ ...form, custos: form.custos.filter((_, j) => j !== i) })}
                        className="text-red-400 hover:text-red-600 text-base leading-none"
                        title="Remover"
                      >✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totais */}
            {form.custos.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-200 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal (sem imposto)</span>
                  <span className="font-semibold text-gray-700">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Imposto NF ({form.imposto || 7}%)</span>
                  <span className="font-semibold text-amber-600">{fmt(subtotal * ((parseFloat(form.imposto) || 7) / 100))}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
                  <span>Custo total</span>
                  <span className="text-emerald-700">{fmt(subtotal * (1 + (parseFloat(form.imposto) || 7) / 100))}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => { setForm(null); setAddMode(null); }} className={btnSecondary}>Cancelar</button>
            <button onClick={salvar} className={btnPrimary}>Salvar</button>
          </div>
        </Card>
      )}

      {/* Lista de produtos cadastrados */}
      <div className="space-y-3">
        {produtos.map(p => {
          const custo = custoProduto(p);
          const subtotalP = (p.custos || []).reduce((a, c) => a + custoItem(c), 0);
          return (
            <Card key={p.id}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium text-gray-900">{p.nome}</span>
                  <span className="ml-2 text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">{p.tipo}</span>
                  <span className="ml-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">NF {((p.imposto || 0.07) * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-700">{fmt(custo)}</span>
                  <button onClick={() => openEditar(p)} className="text-xs text-blue-500 hover:text-blue-700">✏️</button>
                  <button onClick={() => excluir(p.id)} className="text-xs text-red-400 hover:text-red-600">🗑️</button>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                {(p.custos || []).map((c, i) => {
                  const badge = c.tipo === 'material'
                    ? 'bg-blue-50 text-blue-600'
                    : c.tipo === 'servico'
                      ? 'bg-purple-50 text-purple-600'
                      : 'bg-gray-100 text-gray-500';
                  return (
                    <div key={i} className="flex justify-between items-center text-xs gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className={`text-[9px] px-1 py-0.5 rounded-full flex-shrink-0 font-semibold ${badge}`}>
                          {c.tipo === 'material' ? 'mat' : c.tipo === 'servico' ? 'svc' : 'man'}
                        </span>
                        <span className="text-gray-500 truncate">{c.nome}</span>
                        {c.quantidade !== 1 && <span className="text-gray-400 flex-shrink-0">×{c.quantidade}</span>}
                      </div>
                      <span className="font-medium text-gray-700 flex-shrink-0">{fmt(custoItem(c))}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between text-xs col-span-2 border-t border-gray-100 pt-1 mt-1">
                  <span className="text-gray-500">Imposto NF ({((p.imposto || 0.07) * 100).toFixed(0)}%)</span>
                  <span className="font-medium text-amber-700">{fmt(subtotalP * (p.imposto || 0.07))}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── MATERIAIS ───────────────────────────────────────────────────────────────
function MateriaisTab({ materiais, setMateriais, servicos, setServicos }) {
  const [subTab, setSubTab] = useState('materiais');
  const [editM, setEditM] = useState(null);
  const [editS, setEditS] = useState(null);

  function salvarMaterial(m) {
    if (m.id && materiais.find(x => x.id === m.id)) setMateriais(materiais.map(x => x.id === m.id ? m : x));
    else setMateriais([...materiais, { ...m, id: Date.now() }]);
    setEditM(null);
  }
  function salvarServico(s) {
    if (s.id && servicos.find(x => x.id === s.id)) setServicos(servicos.map(x => x.id === s.id ? s : x));
    else setServicos([...servicos, { ...s, id: Date.now() }]);
    setEditS(null);
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setSubTab('materiais')} className={`px-4 py-2 rounded-lg text-sm font-medium ${subTab === 'materiais' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>🧵 Materiais</button>
        <button onClick={() => setSubTab('servicos')} className={`px-4 py-2 rounded-lg text-sm font-medium ${subTab === 'servicos' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>🪡 Serviços</button>
      </div>

      {subTab === 'materiais' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 text-sm">Banco de Materiais ({materiais.length})</h2>
            <button onClick={() => setEditM({ nome: '', valor: '', medida: 'metro', rendimento: '', consumo: '' })} className={btnPrimary}>+ Novo</button>
          </div>
          {editM && (
            <Card title={editM.id ? 'Editar Material' : 'Novo Material'}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome"><input value={editM.nome} onChange={e => setEditM({ ...editM, nome: e.target.value })} className={inp} /></Field>
                <Field label="Valor (R$)"><input type="number" step="0.01" value={editM.valor} onChange={e => setEditM({ ...editM, valor: e.target.value })} className={inp} /></Field>
                <Field label="Medida"><input value={editM.medida} onChange={e => setEditM({ ...editM, medida: e.target.value })} className={inp} placeholder="metro, Kg, unidade..." /></Field>
                <Field label="Rendimento (peças por unidade)"><input type="number" step="0.01" value={editM.rendimento} onChange={e => setEditM({ ...editM, rendimento: e.target.value })} className={inp} placeholder="ex: 3" /></Field>
                <Field label="Consumo por peça (opcional)"><input value={editM.consumo} onChange={e => setEditM({ ...editM, consumo: e.target.value })} className={inp} placeholder="metros, kg etc" /></Field>
              </div>
              <div className="flex gap-2 justify-end mt-3">
                <button onClick={() => setEditM(null)} className={btnSecondary}>Cancelar</button>
                <button onClick={() => salvarMaterial(editM)} className={btnPrimary}>Salvar</button>
              </div>
            </Card>
          )}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="text-left p-3 text-xs text-gray-500 font-medium">Material</th>
                <th className="text-right p-3 text-xs text-gray-500 font-medium">Valor</th>
                <th className="text-center p-3 text-xs text-gray-500 font-medium">Medida</th>
                <th className="text-center p-3 text-xs text-gray-500 font-medium">Rendimento</th>
                <th className="text-center p-3 text-xs text-gray-500 font-medium">Consumo/peça</th>
                <th className="p-3"></th>
              </tr></thead>
              <tbody>
                {materiais.map(m => (
                  <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{m.nome}</td>
                    <td className="p-3 text-right text-emerald-700 font-semibold">{fmt(m.valor)}</td>
                    <td className="p-3 text-center text-gray-500">{m.medida}</td>
                    <td className="p-3 text-center text-gray-500">{m.rendimento || '—'}</td>
                    <td className="p-3 text-center text-gray-500">{m.consumo || '—'}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => setEditM({ ...m })} className="text-blue-400 hover:text-blue-600 mr-2 text-xs">✏️</button>
                      <button onClick={() => setMateriais(materiais.filter(x => x.id !== m.id))} className="text-red-400 hover:text-red-600 text-xs">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'servicos' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 text-sm">Banco de Serviços ({servicos.length})</h2>
            <button onClick={() => setEditS({ nome: '', valor: '', medida: 'peça' })} className={btnPrimary}>+ Novo</button>
          </div>
          {editS && (
            <Card title={editS.id ? 'Editar Serviço' : 'Novo Serviço'}>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Nome" className="col-span-2"><input value={editS.nome} onChange={e => setEditS({ ...editS, nome: e.target.value })} className={inp} /></Field>
                <Field label="Valor (R$)"><input type="number" step="0.01" value={editS.valor} onChange={e => setEditS({ ...editS, valor: e.target.value })} className={inp} /></Field>
              </div>
              <div className="flex gap-2 justify-end mt-3">
                <button onClick={() => setEditS(null)} className={btnSecondary}>Cancelar</button>
                <button onClick={() => salvarServico(editS)} className={btnPrimary}>Salvar</button>
              </div>
            </Card>
          )}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="text-left p-3 text-xs text-gray-500 font-medium">Serviço</th>
                <th className="text-right p-3 text-xs text-gray-500 font-medium">Valor/peça</th>
                <th className="p-3"></th>
              </tr></thead>
              <tbody>
                {servicos.map(s => (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{s.nome}</td>
                    <td className="p-3 text-right text-emerald-700 font-semibold">{fmt(s.valor)}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => setEditS({ ...s })} className="text-blue-400 hover:text-blue-600 mr-2 text-xs">✏️</button>
                      <button onClick={() => setServicos(servicos.filter(x => x.id !== s.id))} className="text-red-400 hover:text-red-600 text-xs">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HISTÓRICO ───────────────────────────────────────────────────────────────
function HistoricoTab({ orcamentos, setOrcamentos, produtos }) {
  async function exportar(orc) {
    const { exportarOrcamentoPDF } = await import('../lib/pdf');
    await exportarOrcamentoPDF(orc);
  }

  if (!orcamentos.length) return (
    <div className="text-center py-16 text-gray-400">
      <div className="text-4xl mb-2">📭</div>
      <p>Nenhum orçamento salvo ainda</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {orcamentos.map(orc => {
        const roi = orc.custoTotal > 0 ? (orc.lucro / orc.custoTotal * 100) : 0;
        return (
          <Card key={orc.id}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-semibold text-gray-900">{orc.cliente}</span>
                <span className="ml-2 text-xs text-gray-400">{orc.data}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Custo {fmt(orc.custoTotal)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${orc.lucro >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>Lucro {fmt(orc.lucro)}</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">ROI {roi.toFixed(1)}%</span>
                <button onClick={() => exportar(orc)} className="text-xs text-orange-500 hover:text-orange-700">📄 PDF</button>
                <button onClick={() => { if (confirm('Excluir?')) setOrcamentos(orcamentos.filter(x => x.id !== orc.id)); }} className="text-xs text-red-400 hover:text-red-600">🗑️</button>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-2">
              <table className="w-full text-xs">
                <thead><tr className="text-gray-400">
                  <th className="text-left pb-1">Produto</th>
                  <th className="text-center pb-1">Qtd</th>
                  <th className="text-right pb-1">Custo unit.</th>
                  <th className="text-right pb-1">Total custo</th>
                </tr></thead>
                <tbody>
                  {orc.itens.map((it, i) => {
                    const p = produtos.find(x => x.id === it.prodId);
                    const cu = p ? custoProduto(p) : 0;
                    return (
                      <tr key={i} className="border-t border-gray-50">
                        <td className="py-1 text-gray-700">{it.nome}</td>
                        <td className="py-1 text-center text-gray-600">{it.qtd}</td>
                        <td className="py-1 text-right text-gray-600">{fmt(cu)}</td>
                        <td className="py-1 text-right font-medium text-emerald-700">{fmt(cu * it.qtd)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex justify-end gap-4 text-xs mt-2 pt-2 border-t border-gray-100">
                <span className="text-gray-500">Venda: <strong className="text-gray-800">{fmt(orc.venda)}</strong></span>
                <span className="text-gray-500">Lucro: <strong className={orc.lucro >= 0 ? 'text-emerald-700' : 'text-red-600'}>{fmt(orc.lucro)}</strong></span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── COLABORADORES ───────────────────────────────────────────────────────────
function ColaboradoresTab({ colaboradores, setColaboradores }) {
  const [form, setForm] = useState(null);
  function salvar() {
    if (!form.nome.trim()) { alert('Informe o nome'); return; }
    if (form.id) setColaboradores(colaboradores.map(x => x.id === form.id ? form : x));
    else setColaboradores([...colaboradores, { ...form, id: Date.now() }]);
    setForm(null);
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-900">Equipe</h2>
        <button onClick={() => setForm({ nome: '', funcao: '' })} className={btnPrimary}>+ Novo</button>
      </div>
      {form && (
        <Card title={form.id ? 'Editar' : 'Novo Colaborador'}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome"><input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className={inp} /></Field>
            <Field label="Função"><input value={form.funcao} onChange={e => setForm({ ...form, funcao: e.target.value })} className={inp} /></Field>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setForm(null)} className={btnSecondary}>Cancelar</button>
            <button onClick={salvar} className={btnPrimary}>Salvar</button>
          </div>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-3">
        {colaboradores.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">{c.nome}</p>
              <p className="text-sm text-gray-500">{c.funcao}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setForm({ ...c })} className="text-blue-400 hover:text-blue-600 text-xs">✏️</button>
              <button onClick={() => { if (confirm('Excluir?')) setColaboradores(colaboradores.filter(x => x.id !== c.id)); }} className="text-red-400 hover:text-red-600 text-xs">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {title && <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>}
      {children}
    </div>
  );
}
function Field({ label, children, className = '' }) {
  return <div className={className}><label className="block text-xs text-gray-500 mb-1">{label}</label>{children}</div>;
}
function Metric({ label, value, color }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-emerald-400 bg-white";
const btnPrimary = "px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors";
const btnSecondary = "px-4 py-2 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors";
