# Sistema de Fardamento

Sistema de orçamento e gestão de custos para confecção/fardamento.

## Stack
- **Next.js 14** (React)
- **Tailwind CSS**
- **jsPDF** — exportação de PDF no browser
- **localStorage** — banco de dados local (sem servidor)

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## Deploy na Vercel (5 minutos)

### Opção 1 — Via GitHub (recomendado)

1. Crie um repositório no GitHub e suba o projeto:
```bash
git init
git add .
git commit -m "primeiro commit"
git remote add origin https://github.com/seu-usuario/fardamento.git
git push -u origin main
```

2. Acesse [vercel.com](https://vercel.com) → "Add New Project"
3. Importe o repositório do GitHub
4. Clique em **Deploy** — pronto!

### Opção 2 — Via Vercel CLI

```bash
npm install -g vercel
vercel
```

Siga o wizard. Em ~2 minutos está no ar.

## Funcionalidades

- **Orçamento** — monte pedidos, calcule custo interno, defina preço de venda manualmente
- **Exportação PDF** — gera PDF profissional do orçamento
- **Produtos** — cadastre peças com composição de custos detalhada + imposto NF
- **Materiais** — banco de materiais e serviços da planilha (Jeans, Malha, Costura etc.)
- **Histórico** — todos os orçamentos salvos com ROI calculado
- **Equipe** — colaboradores cadastrados

## Dados incluídos da planilha (Tomaz)

Materiais pré-cadastrados:
- Jeans R$16/metro (consumo 1,3m)
- Malha Piquet R$52,90/Kg (rendimento 4)
- Malha PP (Mavil, Tico, Laecio, Costa Rica)
- Faixas Refletivas, Ribana, Entretela, Botão, Etiqueta
- ...e todos os serviços (Costura Polo, Social, Calça, Bordado, Pintura etc.)

## Próximos passos (futuro)

- [ ] Supabase para dados persistentes na nuvem (multi-dispositivo)
- [ ] Fluxo de produção por pedido (status: corte → costura → bordado → entrega)
- [ ] Tabela de tamanhos e metragem automática (P/M/G/GG)
- [ ] Login simples com senha
