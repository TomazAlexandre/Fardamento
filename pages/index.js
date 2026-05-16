import { useState, useEffect, useCallback } from 'react';
import {
  getProdutos, saveProdutos, getOrcamentos, saveOrcamentos,
  getMateriais, saveMateriais, getServicos, saveServicos,
  getColaboradores, saveColaboradores,
  custoProduto, fmt,
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
        {tab === 'produtos' && <ProdutosTab produtos={produtos} setProdutos={v => { setProdutos(v); saveProdutos(v); }} />}
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
function ProdutosTab({ produtos, setProdutos }) {
  const [form, setForm] = useState(null); // null = hidden, {} = new, {...} = edit

  function openNovo() {
    setForm({ nome: '', tipo: 'Camisa Polo', imposto: 7, custos: [] });
  }
  function openEditar(p) {
    setForm({ ...p, imposto: (p.imposto || 0.07) * 100, custos: p.custos.map(c => ({ ...c })) });
  }
  function salvar() {
    if (!form.nome.trim()) { alert('Informe o nome'); return; }
    const p = { ...form, imposto: (parseFloat(form.imposto) || 7) / 100, custos: form.custos.filter(c => c.nome) };
    if (p.id) {
      setProdutos(produtos.map(x => x.id === p.id ? p : x));
    } else {
      setProdutos([...produtos, { ...p, id: Date.now() }]);
    }
    setForm(null);
  }
  function excluir(id) {
    if (!confirm('Excluir produto?')) return;
    setProdutos(produtos.filter(p => p.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold text-gray-900">Produtos Cadastrados</h2>
        <button onClick={openNovo} className={btnPrimary}>+ Novo Produto</button>
      </div>

      {form && (
        <Card title={form.id ? `Editando: ${form.nome}` : 'Novo Produto'}>
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
          <div className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-800">Composição de Custos</span>
              <button onClick={() => setForm({ ...form, custos: [...form.custos, { nome: '', valor: '' }] })} className={btnPrimary}>+ Adicionar item</button>
            </div>
            {/* Header da tabela */}
            <div className="flex gap-2 mb-1 px-1">
              <span className="flex-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Nome do item</span>
              <span className="w-32 text-xs font-medium text-gray-400 uppercase tracking-wide">Valor (R$)</span>
              <span className="w-6"></span>
            </div>
            {form.custos.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
                Clique em "+ Adicionar item" para começar
              </p>
            )}
            {form.custos.map((c, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input
                  value={c.nome}
                  onChange={e => setForm({ ...form, custos: form.custos.map((x, j) => j === i ? { ...x, nome: e.target.value } : x) })}
                  placeholder="Ex: Costura, Malha, Bordado..."
                  className={`${inp} flex-1`}
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={c.valor}
                  onChange={e => setForm({ ...form, custos: form.custos.map((x, j) => j === i ? { ...x, valor: e.target.value } : x) })}
                  placeholder="0,00"
                  className={`${inp} w-32 text-right`}
                />
                <button
                  onClick={() => setForm({ ...form, custos: form.custos.filter((_, j) => j !== i) })}
                  className="w-6 text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0"
                  title="Remover item"
                >✕</button>
              </div>
            ))}
            {form.custos.length > 0 && (
              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">Subtotal (sem imposto):</span>
                <span className="text-xs font-semibold text-emerald-700">
                  {fmt(form.custos.reduce((a, c) => a + (parseFloat(c.valor) || 0), 0))}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setForm(null)} className={btnSecondary}>Cancelar</button>
            <button onClick={salvar} className={btnPrimary}>Salvar</button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {produtos.map(p => {
          const custo = custoProduto(p);
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
                {p.custos.map((c, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-500">{c.nome}</span>
                    <span className="font-medium text-gray-700">{fmt(c.valor)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs col-span-2 border-t border-gray-100 pt-1 mt-1">
                  <span className="text-gray-500">Imposto NF ({((p.imposto || 0.07) * 100).toFixed(0)}%)</span>
                  <span className="font-medium text-amber-700">{fmt(p.custos.reduce((a, c) => a + (parseFloat(c.valor) || 0), 0) * (p.imposto || 0.07))}</span>
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
                <Field label="Rendimento"><input value={editM.rendimento} onChange={e => setEditM({ ...editM, rendimento: e.target.value })} className={inp} placeholder="peças por unidade" /></Field>
                <Field label="Consumo por peça"><input value={editM.consumo} onChange={e => setEditM({ ...editM, consumo: e.target.value })} className={inp} placeholder="metros, kg etc" /></Field>
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
