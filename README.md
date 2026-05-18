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



## Funcionalidades

- **Orçamento** — monte pedidos, calcule custo interno, defina preço de venda manualmente
- **Exportação PDF** — gera PDF profissional do orçamento
- **Produtos** — cadastre peças com composição de custos detalhada + imposto NF
- **Materiais** — banco de materiais e serviços da planilha (Jeans, Malha, Costura etc.)
- **Histórico** — todos os orçamentos salvos com ROI calculado
- **Equipe** — colaboradores cadastrados

## Dados incluídos da planilha (Tomaz)

Materiais pré-cadastrados:
- Jeans
- Malha Piquet 
- Malha PP (Mavil, Tico, Laecio, Costa Rica)
- Faixas Refletivas, Ribana, Entretela, Botão, Etiqueta
- ...e todos os serviços (Costura Polo, Social, Calça, Bordado, Pintura etc.)

- [x] Supabase para dados persistentes na nuvem (multi-dispositivo)
- [x] Fluxo de produção por pedido (status: corte → costura → bordado → entrega)
- [x] Tabela de tamanhos e metragem automática (P/M/G/GG)
- [x] Login simples com senha
