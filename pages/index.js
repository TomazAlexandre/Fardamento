import { useState, useEffect, useCallback } from 'react';
import {
  signIn, signUp, signOut, onAuthChange, seedDadosIniciais,
  getMateriais, saveMaterial, deleteMaterial,
  getServicos, saveServico, deleteServico,
  getProdutos, saveProduto, deleteProduto,
  getOrcamentos, saveOrcamento, deleteOrcamento,
  getColaboradores, saveColaborador, deleteColaborador,
  custoProduto, custoItem, fmt,
} from '../lib/db';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const { data: { subscription } } = onAuthChange(async (u) => {
      setUser(u); setLoading(false);
      if (u) await seedDadosIniciais(u.id);
    });
    return () => subscription.unsubscribe();
  }, []);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-400 text-sm">Carregando...</div></div>;
  if (!user) return <LoginPage />;
  return <App user={user} />;
}

function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  async function handleSubmit(e) {
    e.preventDefault(); setErro(''); setMsg(''); setLoading(true);
    try {
      if (mode === 'login') { await signIn(email, senha); }
      else {
        if (!nome.trim()) { setErro('Informe seu nome'); setLoading(false); return; }
        await signUp(email, senha, nome);
        setMsg('Conta criada! Verifique seu e-mail para confirmar.'); setMode('login');
      }
    } catch (err) { setErro(err.message || 'Erro ao autenticar'); }
    setLoading(false);
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">FardaMais</h1>
          <p className="text-sm text-gray-400 mt-1">Gestão de custos e orçamentos</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
            <button onClick={() => { setMode('login'); setErro(''); setMsg(''); }} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode==='login'?'bg-white text-gray-900 shadow-sm':'text-gray-500'}`}>Entrar</button>
            <button onClick={() => { setMode('register'); setErro(''); setMsg(''); }} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode==='register'?'bg-white text-gray-900 shadow-sm':'text-gray-500'}`}>Criar conta</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode==='register' && <div><label className="block text-xs text-gray-500 mb-1">Nome</label><input type="text" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Seu nome" required className={inp}/></div>}
            <div><label className="block text-xs text-gray-500 mb-1">E-mail</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required className={inp}/></div>
            <div><label className="block text-xs text-gray-500 mb-1">Senha</label><input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••" required minLength={6} className={inp}/></div>
            {erro && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}
            {msg  && <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{msg}</p>}
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
              {loading?'Aguarde...':mode==='login'?'Entrar':'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function App({ user }) {
  const [tab, setTab] = useState('orcamento');
  const [produtos, setProdutos] = useState([]);
  const [orcamentos, setOrcamentos] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const carregar = useCallback(async () => {
    setLoadingData(true);
    try {
      const [p,o,m,s,c] = await Promise.all([getProdutos(),getOrcamentos(),getMateriais(),getServicos(),getColaboradores()]);
      setProdutos(p); setOrcamentos(o); setMateriais(m); setServicos(s); setColaboradores(c);
    } catch(e){ console.error(e); }
    setLoadingData(false);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);
  const tabs = [{id:'orcamento',label:'📋 Orçamento'},{id:'produtos',label:'👕 Produtos'},{id:'materiais',label:'🧵 Materiais'},{id:'historico',label:'📁 Histórico'},{id:'colaboradores',label:'👥 Equipe'}];
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div><h1 className="text-base font-semibold text-gray-900">FardaMais</h1><p className="text-xs text-gray-400">{user.user_metadata?.nome||user.email}</p></div>
          <div className="flex gap-1 flex-wrap items-center">
            {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab===t.id?'bg-emerald-600 text-white':'text-gray-500 hover:bg-gray-100'}`}>{t.label}</button>)}
            <button onClick={signOut} className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">⎋ Sair</button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {loadingData ? <div className="text-center py-20 text-gray-400 text-sm">Carregando dados...</div> : (
          <>
            {tab==='orcamento' && <OrcamentoTab produtos={produtos} orcamentos={orcamentos} onSaveOrcamento={async(o)=>{const s=await saveOrcamento(o);setOrcamentos(prev=>[s,...prev.filter(x=>x.id!==s.id)]);}}/>}
            {tab==='produtos' && <ProdutosTab produtos={produtos} materiais={materiais} servicos={servicos} onSave={async(p)=>{const s=await saveProduto(p);setProdutos(prev=>prev.find(x=>x.id===s.id)?prev.map(x=>x.id===s.id?s:x):[...prev,s]);}} onDelete={async(id)=>{await deleteProduto(id);setProdutos(prev=>prev.filter(x=>x.id!==id));}}/>}
            {tab==='materiais' && <MateriaisTab materiais={materiais} servicos={servicos} onSaveMaterial={async(m)=>{const s=await saveMaterial(m);setMateriais(prev=>prev.find(x=>x.id===s.id)?prev.map(x=>x.id===s.id?s:x):[...prev,s]);}} onDeleteMaterial={async(id)=>{await deleteMaterial(id);setMateriais(prev=>prev.filter(x=>x.id!==id));}} onSaveServico={async(s)=>{const sv=await saveServico(s);setServicos(prev=>prev.find(x=>x.id===sv.id)?prev.map(x=>x.id===sv.id?sv:x):[...prev,sv]);}} onDeleteServico={async(id)=>{await deleteServico(id);setServicos(prev=>prev.filter(x=>x.id!==id));}}/>}
            {tab==='historico' && <HistoricoTab orcamentos={orcamentos} produtos={produtos} onDelete={async(id)=>{await deleteOrcamento(id);setOrcamentos(prev=>prev.filter(x=>x.id!==id));}}/>}
            {tab==='colaboradores' && <ColaboradoresTab colaboradores={colaboradores} onSave={async(c)=>{const s=await saveColaborador(c);setColaboradores(prev=>prev.find(x=>x.id===s.id)?prev.map(x=>x.id===s.id?s:x):[...prev,s]);}} onDelete={async(id)=>{await deleteColaborador(id);setColaboradores(prev=>prev.filter(x=>x.id!==id));}}/>}
          </>
        )}
      </main>
    </div>
  );
}

function OrcamentoTab({ produtos, onSaveOrcamento }) {
  const [cliente, setCliente] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [obs, setObs] = useState('');
  const [itens, setItens] = useState([]);
  const [selProd, setSelProd] = useState('');
  const [venda, setVenda] = useState('');
  const [salvando, setSalvando] = useState(false);
  const custoTotal = itens.reduce((a,it)=>{const p=produtos.find(x=>x.id===it.prodId);return a+(p?custoProduto(p)*(parseInt(it.qtd)||0):0);},0);
  const lucro = (parseFloat(venda)||0) - custoTotal;
  function addItem() {
    const p = produtos.find(x=>x.id===selProd); if(!p) return;
    const existe = itens.find(x=>x.prodId===selProd);
    if(existe) setItens(itens.map(x=>x.prodId===selProd?{...x,qtd:x.qtd+1}:x));
    else setItens([...itens,{prodId:p.id,nome:p.nome,qtd:1}]);
  }
  async function exportarPDF() {
    if(!cliente.trim()||!itens.length){alert('Preencha cliente e adicione itens.');return;}
    const {exportarOrcamentoPDF} = await import('../lib/pdf');
    await exportarOrcamentoPDF({cliente,data,obs,itens,custo_total:custoTotal,venda:parseFloat(venda)||0,lucro},produtos);
  }
  async function salvar() {
    if(!cliente.trim()){alert('Informe o cliente');return;}
    if(!itens.length){alert('Adicione pelo menos um item');return;}
    setSalvando(true);
    try {
      await onSaveOrcamento({cliente,data,obs,itens:[...itens],custo_total:custoTotal,venda:parseFloat(venda)||0,lucro});
      setCliente('');setItens([]);setVenda('');setObs('');alert('Orçamento salvo!');
    } catch(e){alert('Erro: '+e.message);}
    setSalvando(false);
  }
  return (
    <div className="space-y-4">
      <Card title="Dados do Pedido">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cliente"><input value={cliente} onChange={e=>setCliente(e.target.value)} placeholder="Nome do cliente" className={inp}/></Field>
          <Field label="Data"><input type="date" value={data} onChange={e=>setData(e.target.value)} className={inp}/></Field>
        </div>
        <Field label="Observações" className="mt-3"><input value={obs} onChange={e=>setObs(e.target.value)} placeholder="Observações..." className={inp}/></Field>
      </Card>
      <Card title="Itens do Pedido">
        <div className="flex gap-2 mb-4">
          <select value={selProd} onChange={e=>setSelProd(e.target.value)} className={`${inp} flex-1`}>
            <option value="">Selecionar produto...</option>
            {produtos.map(p=><option key={p.id} value={p.id}>{p.nome} — {fmt(custoProduto(p))}</option>)}
          </select>
          <button onClick={addItem} className={btnPrimary}>+ Adicionar</button>
        </div>
        {itens.length===0 && <p className="text-center text-gray-400 text-sm py-6">Nenhum item adicionado</p>}
        <div className="space-y-2">
          {itens.map((it,i)=>{
            const p=produtos.find(x=>x.id===it.prodId); const cu=p?custoProduto(p):0;
            return (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <span className="flex-1 text-sm font-medium text-gray-800">{it.nome}</span>
                <span className="text-xs text-gray-400 w-24">Unit: {fmt(cu)}</span>
                <input type="number" min="1" value={it.qtd} onChange={e=>setItens(itens.map((x,j)=>j===i?{...x,qtd:parseInt(e.target.value)||1}:x))} className="w-16 text-center border border-gray-200 rounded-md py-1 text-sm"/>
                <span className="text-sm font-semibold text-emerald-700 w-20 text-right">{fmt(cu*it.qtd)}</span>
                <button onClick={()=>setItens(itens.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </div>
            );
          })}
        </div>
      </Card>
      <Card title="Resumo Financeiro">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Metric label="Custo interno" value={fmt(custoTotal)} color="text-emerald-700"/>
          <Metric label="Valor de venda" value={fmt(parseFloat(venda)||0)} color="text-blue-700"/>
          <Metric label="Lucro" value={fmt(lucro)} color={lucro>=0?'text-emerald-700':'text-red-600'}/>
        </div>
        <Field label="Preço de venda ao cliente">
          <input type="number" step="0.01" value={venda} onChange={e=>setVenda(e.target.value)} placeholder="0,00" className={`${inp} text-lg font-semibold`}/>
        </Field>
      </Card>
      <div className="flex gap-3 justify-end">
        <button onClick={()=>{setItens([]);setVenda('');setCliente('');}} className={btnSecondary}>Limpar</button>
        <button onClick={exportarPDF} className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">📄 PDF</button>
        <button onClick={salvar} disabled={salvando} className={`${btnPrimary} disabled:opacity-50`}>{salvando?'Salvando...':'✓ Salvar'}</button>
      </div>
    </div>
  );
}

function ProdutosTab({ produtos, materiais, servicos, onSave, onDelete }) {
  const [form, setForm] = useState(null);
  const [addMode, setAddMode] = useState(null);
  const [itemBanco, setItemBanco] = useState({tipo:'servico',refId:'',quantidade:1});
  const [salvando, setSalvando] = useState(false);
  function openNovo(){setForm({nome:'',tipo:'Camisa Polo',usarImposto:true,imposto:7,custos:[]});setAddMode(null);}
  function openEditar(p){setForm({...p,imposto:(p.imposto||0.07)*100,usarImposto:p.usarImposto!==false,custos:p.custos.map(c=>({...c}))});setAddMode(null);}
  async function salvar(){
    if(!form.nome.trim()){alert('Informe o nome');return;}
    setSalvando(true);
    try{const p={...form,imposto:(parseFloat(form.imposto)||7)/100};await onSave(p);setForm(null);setAddMode(null);}
    catch(e){alert('Erro: '+e.message);}
    setSalvando(false);
  }
  function confirmarItemBanco(){
    if(!itemBanco.refId){alert('Selecione um item');return;}
    const qtd=parseFloat(itemBanco.quantidade)||1;
    const lista=itemBanco.tipo==='material'?materiais:servicos;
    const item=lista.find(x=>x.id===itemBanco.refId);if(!item)return;
    const novoItem=itemBanco.tipo==='material'
      ?{tipo:'material',refId:item.id,nome:item.nome,quantidade:qtd,valorRef:parseFloat(item.valor),rendimento:parseFloat(item.rendimento)||1,medida:item.medida}
      :{tipo:'servico',refId:item.id,nome:item.nome,quantidade:qtd,valorRef:parseFloat(item.valor),medida:item.medida};
    setForm({...form,custos:[...form.custos,novoItem]});
    setItemBanco({tipo:'servico',refId:'',quantidade:1});setAddMode(null);
  }
  function updateCusto(i,campo,valor){setForm({...form,custos:form.custos.map((c,j)=>j===i?{...c,[campo]:valor}:c)});}
  const subtotal=form?form.custos.reduce((a,c)=>a+custoItem(c),0):0;
  const impostoValor=form&&form.usarImposto?subtotal*((parseFloat(form.imposto)||7)/100):0;
  const totalComImposto=subtotal+impostoValor;
  const listaBanco=itemBanco.tipo==='material'?materiais:servicos;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold text-gray-900">Produtos Cadastrados</h2>
        <button onClick={openNovo} className={btnPrimary}>+ Novo Produto</button>
      </div>
      {form && (
        <Card title={form.id?`Editando: ${form.nome}`:'Novo Produto'}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Nome"><input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} className={inp} placeholder="Nome do produto"/></Field>
            <Field label="Tipo">
              <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} className={inp}>
                {['Camisa Polo','Camisa Social','Camiseta','Jaleco','Bermuda','Calça','Outro'].map(t=><option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          {/* Toggle imposto */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <button onClick={()=>setForm({...form,usarImposto:!form.usarImposto})}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${form.usarImposto?'bg-amber-500':'bg-gray-200'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.usarImposto?'translate-x-5':'translate-x-0.5'}`}/>
            </button>
            <span className="text-sm font-medium text-amber-800">Incluir Imposto NF</span>
            {form.usarImposto && (
              <div className="flex items-center gap-1 ml-auto">
                <input type="number" value={form.imposto} onChange={e=>setForm({...form,imposto:e.target.value})} className="w-16 border border-amber-200 rounded-lg px-2 py-1 text-sm text-center bg-white"/>
                <span className="text-sm text-amber-700">%</span>
              </div>
            )}
          </div>
          {/* Composição */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-800">Composição de Custos</span>
              <div className="flex gap-2">
                <button onClick={()=>setAddMode(addMode==='banco'?null:'banco')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${addMode==='banco'?'bg-emerald-600 text-white':'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}>🧵 Do banco</button>
                <button onClick={()=>{setAddMode(null);setForm({...form,custos:[...form.custos,{tipo:'manual',nome:'',quantidade:1,valorManual:''}]});}} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors">✏️ Manual</button>
              </div>
            </div>
            {addMode==='banco' && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs font-semibold text-emerald-800 mb-2">Adicionar do banco</p>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Tipo">
                    <select value={itemBanco.tipo} onChange={e=>setItemBanco({tipo:e.target.value,refId:'',quantidade:1})} className={inp}>
                      <option value="servico">🪡 Serviço</option>
                      <option value="material">🧵 Material</option>
                    </select>
                  </Field>
                  <Field label={itemBanco.tipo==='material'?'Material':'Serviço'}>
                    <select value={itemBanco.refId} onChange={e=>setItemBanco({...itemBanco,refId:e.target.value})} className={inp}>
                      <option value="">Selecione...</option>
                      {listaBanco.map(x=><option key={x.id} value={x.id}>{x.nome} — {fmt(x.valor)}/{x.medida}{itemBanco.tipo==='material'&&x.rendimento?` (rend.${x.rendimento})`:''}</option>)}
                    </select>
                  </Field>
                  <Field label="Quantidade"><input type="number" step="0.01" min="0.01" value={itemBanco.quantidade} onChange={e=>setItemBanco({...itemBanco,quantidade:e.target.value})} className={inp}/></Field>
                </div>
                {itemBanco.refId && (()=>{
                  const item=listaBanco.find(x=>x.id===itemBanco.refId);if(!item)return null;
                  const qtd=parseFloat(itemBanco.quantidade)||1;
                  let custo,formula;
                  if(itemBanco.tipo==='material'){const rend=parseFloat(item.rendimento)||1;custo=(item.valor/rend)*qtd;formula=`${fmt(item.valor)} ÷ ${rend} × ${qtd} = ${fmt(custo)}`;}
                  else{custo=item.valor*qtd;formula=`${fmt(item.valor)} × ${qtd} = ${fmt(custo)}`;}
                  return <div className="mt-2 flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-emerald-200"><span className="text-xs text-gray-500 font-mono">{formula}</span><span className="text-sm font-semibold text-emerald-700">{fmt(custo)}</span></div>;
                })()}
                <div className="flex gap-2 justify-end mt-2">
                  <button onClick={()=>setAddMode(null)} className={`${btnSecondary} text-xs py-1 px-3`}>Cancelar</button>
                  <button onClick={confirmarItemBanco} className={`${btnPrimary} text-xs py-1 px-3`}>+ Adicionar</button>
                </div>
              </div>
            )}
            {form.custos.length===0&&addMode!=='banco' && <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">Clique em "🧵 Do banco" ou "✏️ Manual" para adicionar itens</p>}
            <div className="space-y-2">
              {form.custos.length>0 && (
                <div className="grid grid-cols-12 gap-2 px-1 mb-1">
                  <span className="col-span-5 text-xs font-medium text-gray-400 uppercase">Item</span>
                  <span className="col-span-2 text-xs font-medium text-gray-400 uppercase text-center">Qtd</span>
                  <span className="col-span-2 text-xs font-medium text-gray-400 uppercase text-right">Valor unit.</span>
                  <span className="col-span-2 text-xs font-medium text-gray-400 uppercase text-right">Custo</span>
                  <span className="col-span-1"></span>
                </div>
              )}
              {form.custos.map((c,i)=>{
                const custo=custoItem(c);
                const badge=c.tipo==='material'?'bg-blue-50 text-blue-600':c.tipo==='servico'?'bg-purple-50 text-purple-600':'bg-gray-100 text-gray-500';
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg px-2 py-2">
                    <div className="col-span-5 flex items-center gap-1.5 min-w-0">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge}`}>{c.tipo==='material'?'mat':c.tipo==='servico'?'svc':'man'}</span>
                      {c.tipo==='manual'?<input value={c.nome} onChange={e=>updateCusto(i,'nome',e.target.value)} placeholder="Nome..." className="text-xs border border-gray-200 rounded px-2 py-1 flex-1 min-w-0 bg-white"/>:<span className="text-xs font-medium text-gray-800 truncate">{c.nome}</span>}
                    </div>
                    <div className="col-span-2"><input type="number" step="0.01" min="0.01" value={c.quantidade} onChange={e=>updateCusto(i,'quantidade',parseFloat(e.target.value)||1)} className="w-full text-center text-xs border border-gray-200 rounded-md py-1 bg-white"/></div>
                    <div className="col-span-2 text-right">
                      {c.tipo==='manual'?<input type="number" step="0.01" min="0" value={c.valorManual} onChange={e=>updateCusto(i,'valorManual',e.target.value)} placeholder="0,00" className="w-full text-right text-xs border border-gray-200 rounded-md py-1 bg-white"/>:<span className="text-xs text-gray-500">{c.tipo==='material'?`${fmt(c.valorRef)}/${c.medida}÷${c.rendimento}`:fmt(c.valorRef)}</span>}
                    </div>
                    <div className="col-span-2 text-right"><span className="text-sm font-semibold text-emerald-700">{fmt(custo)}</span></div>
                    <div className="col-span-1 flex justify-center"><button onClick={()=>setForm({...form,custos:form.custos.filter((_,j)=>j!==i)})} className="text-red-400 hover:text-red-600 text-base">✕</button></div>
                  </div>
                );
              })}
            </div>
            {form.custos.length>0 && (
              <div className="mt-3 pt-2 border-t border-gray-200 space-y-1">
                <div className="flex justify-between text-xs text-gray-500"><span>Subtotal (sem imposto)</span><span className="font-semibold text-gray-700">{fmt(subtotal)}</span></div>
                {form.usarImposto && <div className="flex justify-between text-xs text-gray-500"><span>Imposto NF ({form.imposto||7}%)</span><span className="font-semibold text-amber-600">{fmt(impostoValor)}</span></div>}
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200"><span>Custo total</span><span className="text-emerald-700">{fmt(totalComImposto)}</span></div>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={()=>{setForm(null);setAddMode(null);}} className={btnSecondary}>Cancelar</button>
            <button onClick={salvar} disabled={salvando} className={`${btnPrimary} disabled:opacity-50`}>{salvando?'Salvando...':'Salvar'}</button>
          </div>
        </Card>
      )}
      <div className="space-y-3">
        {produtos.map(p=>{
          const custo=custoProduto(p);
          const subtotalP=(p.custos||[]).reduce((a,c)=>a+custoItem(c),0);
          const temImposto=p.usarImposto!==false;
          return (
            <Card key={p.id}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{p.nome}</span>
                  <span className="text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">{p.tipo}</span>
                  {temImposto?<span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">NF {((p.imposto||0.07)*100).toFixed(0)}%</span>:<span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Sem imposto</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-700">{fmt(custo)}</span>
                  <button onClick={()=>openEditar(p)} className="text-xs text-blue-500 hover:text-blue-700">✏️</button>
                  <button onClick={()=>{if(confirm('Excluir produto?'))onDelete(p.id);}} className="text-xs text-red-400 hover:text-red-600">🗑️</button>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                {(p.custos||[]).map((c,i)=>{
                  const badge=c.tipo==='material'?'bg-blue-50 text-blue-600':c.tipo==='servico'?'bg-purple-50 text-purple-600':'bg-gray-100 text-gray-500';
                  return (<div key={i} className="flex justify-between items-center text-xs gap-1"><div className="flex items-center gap-1 min-w-0"><span className={`text-[9px] px-1 py-0.5 rounded-full flex-shrink-0 font-semibold ${badge}`}>{c.tipo==='material'?'mat':c.tipo==='servico'?'svc':'man'}</span><span className="text-gray-500 truncate">{c.nome}</span>{c.quantidade!==1&&<span className="text-gray-400 flex-shrink-0">×{c.quantidade}</span>}</div><span className="font-medium text-gray-700 flex-shrink-0">{fmt(custoItem(c))}</span></div>);
                })}
                {temImposto && <div className="flex justify-between text-xs col-span-2 border-t border-gray-100 pt-1 mt-1"><span className="text-gray-500">Imposto NF ({((p.imposto||0.07)*100).toFixed(0)}%)</span><span className="font-medium text-amber-700">{fmt(subtotalP*(p.imposto||0.07))}</span></div>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MateriaisTab({ materiais, servicos, onSaveMaterial, onDeleteMaterial, onSaveServico, onDeleteServico }) {
  const [subTab, setSubTab] = useState('materiais');
  const [editM, setEditM] = useState(null);
  const [editS, setEditS] = useState(null);
  const [salvando, setSalvando] = useState(false);
  async function hSM(){setSalvando(true);try{await onSaveMaterial(editM);setEditM(null);}catch(e){alert('Erro: '+e.message);}setSalvando(false);}
  async function hSS(){setSalvando(true);try{await onSaveServico(editS);setEditS(null);}catch(e){alert('Erro: '+e.message);}setSalvando(false);}
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={()=>setSubTab('materiais')} className={`px-4 py-2 rounded-lg text-sm font-medium ${subTab==='materiais'?'bg-emerald-600 text-white':'bg-white text-gray-600 border border-gray-200'}`}>🧵 Materiais</button>
        <button onClick={()=>setSubTab('servicos')} className={`px-4 py-2 rounded-lg text-sm font-medium ${subTab==='servicos'?'bg-emerald-600 text-white':'bg-white text-gray-600 border border-gray-200'}`}>🪡 Serviços</button>
      </div>
      {subTab==='materiais' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center"><h2 className="font-semibold text-gray-900 text-sm">Banco de Materiais ({materiais.length})</h2><button onClick={()=>setEditM({nome:'',valor:'',medida:'metro',rendimento:'',consumo:''})} className={btnPrimary}>+ Novo</button></div>
          {editM && (<Card title={editM.id?'Editar Material':'Novo Material'}><div className="grid grid-cols-2 gap-3"><Field label="Nome"><input value={editM.nome} onChange={e=>setEditM({...editM,nome:e.target.value})} className={inp}/></Field><Field label="Valor (R$)"><input type="number" step="0.01" value={editM.valor} onChange={e=>setEditM({...editM,valor:e.target.value})} className={inp}/></Field><Field label="Medida"><input value={editM.medida} onChange={e=>setEditM({...editM,medida:e.target.value})} className={inp} placeholder="metro, Kg, unidade..."/></Field><Field label="Rendimento"><input type="number" step="0.01" value={editM.rendimento} onChange={e=>setEditM({...editM,rendimento:e.target.value})} className={inp}/></Field></div><div className="flex gap-2 justify-end mt-3"><button onClick={()=>setEditM(null)} className={btnSecondary}>Cancelar</button><button onClick={hSM} disabled={salvando} className={`${btnPrimary} disabled:opacity-50`}>{salvando?'Salvando...':'Salvar'}</button></div></Card>)}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="text-left p-3 text-xs text-gray-500 font-medium">Material</th><th className="text-right p-3 text-xs text-gray-500 font-medium">Valor</th><th className="text-center p-3 text-xs text-gray-500 font-medium">Medida</th><th className="text-center p-3 text-xs text-gray-500 font-medium">Rendimento</th><th className="p-3"></th></tr></thead><tbody>{materiais.map(m=><tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50"><td className="p-3 font-medium text-gray-800">{m.nome}</td><td className="p-3 text-right text-emerald-700 font-semibold">{fmt(m.valor)}</td><td className="p-3 text-center text-gray-500">{m.medida}</td><td className="p-3 text-center text-gray-500">{m.rendimento||'—'}</td><td className="p-3 text-right"><button onClick={()=>setEditM({...m})} className="text-blue-400 hover:text-blue-600 mr-2 text-xs">✏️</button><button onClick={()=>{if(confirm('Excluir?'))onDeleteMaterial(m.id);}} className="text-red-400 hover:text-red-600 text-xs">🗑️</button></td></tr>)}</tbody></table></div>
        </div>
      )}
      {subTab==='servicos' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center"><h2 className="font-semibold text-gray-900 text-sm">Banco de Serviços ({servicos.length})</h2><button onClick={()=>setEditS({nome:'',valor:'',medida:'peça'})} className={btnPrimary}>+ Novo</button></div>
          {editS && (<Card title={editS.id?'Editar Serviço':'Novo Serviço'}><div className="grid grid-cols-3 gap-3"><Field label="Nome" className="col-span-2"><input value={editS.nome} onChange={e=>setEditS({...editS,nome:e.target.value})} className={inp}/></Field><Field label="Valor (R$)"><input type="number" step="0.01" value={editS.valor} onChange={e=>setEditS({...editS,valor:e.target.value})} className={inp}/></Field></div><div className="flex gap-2 justify-end mt-3"><button onClick={()=>setEditS(null)} className={btnSecondary}>Cancelar</button><button onClick={hSS} disabled={salvando} className={`${btnPrimary} disabled:opacity-50`}>{salvando?'Salvando...':'Salvar'}</button></div></Card>)}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="text-left p-3 text-xs text-gray-500 font-medium">Serviço</th><th className="text-right p-3 text-xs text-gray-500 font-medium">Valor/peça</th><th className="p-3"></th></tr></thead><tbody>{servicos.map(s=><tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50"><td className="p-3 font-medium text-gray-800">{s.nome}</td><td className="p-3 text-right text-emerald-700 font-semibold">{fmt(s.valor)}</td><td className="p-3 text-right"><button onClick={()=>setEditS({...s})} className="text-blue-400 hover:text-blue-600 mr-2 text-xs">✏️</button><button onClick={()=>{if(confirm('Excluir?'))onDeleteServico(s.id);}} className="text-red-400 hover:text-red-600 text-xs">🗑️</button></td></tr>)}</tbody></table></div>
        </div>
      )}
    </div>
  );
}

function HistoricoTab({ orcamentos, produtos, onDelete }) {
  const [caixaAberto, setCaixaAberto] = useState(null);
  const [movimentos, setMovimentos] = useState({});
  const [novoMov, setNovoMov] = useState({tipo:'entrada',descricao:'',valor:'',data:new Date().toISOString().split('T')[0]});
  const [loadingCaixa, setLoadingCaixa] = useState(false);
  const [salvandoMov, setSalvandoMov] = useState(false);

  async function abrirCaixa(orcId) {
    if(caixaAberto===orcId){setCaixaAberto(null);return;}
    setCaixaAberto(orcId);
    if(movimentos[orcId])return;
    setLoadingCaixa(true);
    try{const{data,error}=await supabase.from('caixa').select('*').eq('orcamento_id',orcId).order('data');if(error)throw error;setMovimentos(prev=>({...prev,[orcId]:data}));}
    catch(e){alert('Erro ao carregar caixa: '+e.message);}
    setLoadingCaixa(false);
  }

  async function adicionarMovimento(orcId) {
    if(!novoMov.descricao.trim()||!novoMov.valor){alert('Preencha descrição e valor');return;}
    setSalvandoMov(true);
    try{
      const{data,error}=await supabase.from('caixa').insert({orcamento_id:orcId,tipo:novoMov.tipo,descricao:novoMov.descricao,valor:parseFloat(novoMov.valor),data:novoMov.data}).select().single();
      if(error)throw error;
      setMovimentos(prev=>({...prev,[orcId]:[...(prev[orcId]||[]),data]}));
      setNovoMov({tipo:'entrada',descricao:'',valor:'',data:new Date().toISOString().split('T')[0]});
    }catch(e){alert('Erro: '+e.message);}
    setSalvandoMov(false);
  }

  async function excluirMovimento(orcId,movId) {
    if(!confirm('Excluir movimentação?'))return;
    const{error}=await supabase.from('caixa').delete().eq('id',movId);
    if(error){alert('Erro: '+error.message);return;}
    setMovimentos(prev=>({...prev,[orcId]:prev[orcId].filter(x=>x.id!==movId)}));
  }

  async function exportarOrcPDF(orc){const{exportarOrcamentoPDF}=await import('../lib/pdf');await exportarOrcamentoPDF(orc,produtos);}
  async function exportarProtocolo(orc){const{exportarProtocoloPDF}=await import('../lib/pdf');await exportarProtocoloPDF(orc);}

  if(!orcamentos.length) return <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-2">📭</div><p>Nenhum orçamento salvo ainda</p></div>;

  return (
    <div className="space-y-4">
      {orcamentos.map(orc=>{
        const custoTotal=parseFloat(orc.custo_total||0);
        const lucro=parseFloat(orc.lucro||0);
        const venda=parseFloat(orc.venda||0);
        const roi=custoTotal>0?(lucro/custoTotal*100):0;
        const movs=movimentos[orc.id]||[];
        const totalEntradas=movs.filter(m=>m.tipo==='entrada').reduce((a,m)=>a+parseFloat(m.valor),0);
        const totalSaidas=movs.filter(m=>m.tipo==='saida').reduce((a,m)=>a+parseFloat(m.valor),0);
        const saldo=totalEntradas-totalSaidas;
        const caixaEstaAberto=caixaAberto===orc.id;
        return (
          <Card key={orc.id}>
            <div className="flex justify-between items-start mb-3">
              <div><span className="font-semibold text-gray-900">{orc.cliente}</span><span className="ml-2 text-xs text-gray-400">{orc.data}</span></div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Custo {fmt(custoTotal)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${lucro>=0?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-700'}`}>Lucro {fmt(lucro)}</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">ROI {roi.toFixed(1)}%</span>
                <button onClick={()=>exportarOrcPDF(orc)} className="text-xs text-orange-500 hover:text-orange-700 px-1.5" title="Orçamento PDF">📄 Orç.</button>
                <button onClick={()=>exportarProtocolo(orc)} className="text-xs text-purple-500 hover:text-purple-700 px-1.5" title="Protocolo de Entrega">📦 Protocolo</button>
                <button onClick={()=>abrirCaixa(orc.id)} className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${caixaEstaAberto?'bg-emerald-600 text-white border-emerald-600':'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}>
                  💰 Caixa{movs.length>0?` (${movs.length})`:''}
                </button>
                <button onClick={()=>{if(confirm('Excluir orçamento?'))onDelete(orc.id);}} className="text-xs text-red-400 hover:text-red-600 px-1">🗑️</button>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-2">
              <table className="w-full text-xs"><thead><tr className="text-gray-400"><th className="text-left pb-1">Produto</th><th className="text-center pb-1">Qtd</th><th className="text-right pb-1">Custo unit.</th><th className="text-right pb-1">Total</th></tr></thead>
              <tbody>{(orc.itens||[]).map((it,i)=>{const p=produtos.find(x=>x.id===it.prodId);const cu=p?custoProduto(p):0;return(<tr key={i} className="border-t border-gray-50"><td className="py-1 text-gray-700">{it.nome}</td><td className="py-1 text-center text-gray-600">{it.qtd}</td><td className="py-1 text-right text-gray-600">{fmt(cu)}</td><td className="py-1 text-right font-medium text-emerald-700">{fmt(cu*it.qtd)}</td></tr>);})}</tbody></table>
              <div className="flex justify-end gap-4 text-xs mt-2 pt-2 border-t border-gray-100">
                <span className="text-gray-500">Venda: <strong className="text-gray-800">{fmt(venda)}</strong></span>
                <span className="text-gray-500">Lucro: <strong className={lucro>=0?'text-emerald-700':'text-red-600'}>{fmt(lucro)}</strong></span>
              </div>
            </div>
            {/* CAIXA */}
            {caixaEstaAberto && (
              <div className="mt-4 pt-4 border-t-2 border-emerald-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-800">💰 Caixa do Pedido</span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-emerald-600 font-semibold">+ {fmt(totalEntradas)}</span>
                    <span className="text-red-500 font-semibold">− {fmt(totalSaidas)}</span>
                    <span className={`font-bold ${saldo>=0?'text-emerald-700':'text-red-600'}`}>= {fmt(saldo)}</span>
                  </div>
                </div>
                {loadingCaixa?<p className="text-xs text-gray-400 text-center py-3">Carregando...</p>:(
                  <>
                    {movs.length===0&&<p className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg mb-3">Nenhuma movimentação ainda</p>}
                    {movs.length>0&&<div className="space-y-1 mb-3">{movs.map(m=>(
                      <div key={m.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${m.tipo==='entrada'?'bg-emerald-50':'bg-red-50'}`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${m.tipo==='entrada'?'bg-emerald-500':'bg-red-400'}`}/>
                        <span className="flex-1 text-gray-700 font-medium">{m.descricao}</span>
                        <span className="text-gray-400">{m.data}</span>
                        <span className={`font-semibold w-20 text-right ${m.tipo==='entrada'?'text-emerald-700':'text-red-600'}`}>{m.tipo==='entrada'?'+':'−'} {fmt(m.valor)}</span>
                        <button onClick={()=>excluirMovimento(orc.id,m.id)} className="text-gray-300 hover:text-red-400 ml-1">✕</button>
                      </div>
                    ))}</div>}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Nova movimentação</p>
                      <div className="grid grid-cols-4 gap-2">
                        <Field label="Tipo"><select value={novoMov.tipo} onChange={e=>setNovoMov({...novoMov,tipo:e.target.value})} className={inp}><option value="entrada">✅ Entrada</option><option value="saida">❌ Saída</option></select></Field>
                        <Field label="Descrição"><input value={novoMov.descricao} onChange={e=>setNovoMov({...novoMov,descricao:e.target.value})} placeholder="Ex: Pagamento parcial" className={inp}/></Field>
                        <Field label="Valor (R$)"><input type="number" step="0.01" min="0" value={novoMov.valor} onChange={e=>setNovoMov({...novoMov,valor:e.target.value})} className={inp}/></Field>
                        <Field label="Data"><input type="date" value={novoMov.data} onChange={e=>setNovoMov({...novoMov,data:e.target.value})} className={inp}/></Field>
                      </div>
                      <div className="flex justify-end mt-2">
                        <button onClick={()=>adicionarMovimento(orc.id)} disabled={salvandoMov} className={`${btnPrimary} text-xs py-1.5 disabled:opacity-50`}>{salvandoMov?'Salvando...':'+ Adicionar'}</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function ColaboradoresTab({ colaboradores, onSave, onDelete }) {
  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);
  async function salvar(){if(!form.nome.trim()){alert('Informe o nome');return;}setSalvando(true);try{await onSave(form);setForm(null);}catch(e){alert('Erro: '+e.message);}setSalvando(false);}
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h2 className="font-semibold text-gray-900">Equipe</h2><button onClick={()=>setForm({nome:'',funcao:''})} className={btnPrimary}>+ Novo</button></div>
      {form&&(<Card title={form.id?'Editar':'Novo Colaborador'}><div className="grid grid-cols-2 gap-3"><Field label="Nome"><input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} className={inp}/></Field><Field label="Função"><input value={form.funcao} onChange={e=>setForm({...form,funcao:e.target.value})} className={inp}/></Field></div><div className="flex gap-2 justify-end mt-3"><button onClick={()=>setForm(null)} className={btnSecondary}>Cancelar</button><button onClick={salvar} disabled={salvando} className={`${btnPrimary} disabled:opacity-50`}>{salvando?'Salvando...':'Salvar'}</button></div></Card>)}
      <div className="grid grid-cols-2 gap-3">{colaboradores.map(c=><div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center"><div><p className="font-medium text-gray-900">{c.nome}</p><p className="text-sm text-gray-500">{c.funcao}</p></div><div className="flex gap-2"><button onClick={()=>setForm({...c})} className="text-blue-400 hover:text-blue-600 text-xs">✏️</button><button onClick={()=>{if(confirm('Excluir?'))onDelete(c.id);}} className="text-red-400 hover:text-red-600 text-xs">🗑️</button></div></div>)}</div>
    </div>
  );
}

function Card({title,children}){return(<div className="bg-white rounded-xl border border-gray-200 p-4">{title&&<h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>}{children}</div>);}
function Field({label,children,className=''}){return(<div className={className}><label className="block text-xs text-gray-500 mb-1">{label}</label>{children}</div>);}
function Metric({label,value,color}){return(<div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400 mb-1">{label}</p><p className={`text-lg font-semibold ${color}`}>{value}</p></div>);}

const inp="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-emerald-400 bg-white";
const btnPrimary="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors";
const btnSecondary="px-4 py-2 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors";
