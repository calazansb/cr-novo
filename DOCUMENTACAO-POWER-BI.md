# Documentação - Integração com Power BI

## 📊 Modelo de Dados Estrela

O sistema fornece views SQL otimizadas para criação de dashboards no Power BI seguindo o modelo estrela (star schema).

### Tabela Fato: `fato_decisao`

Contém as métricas principais e chaves para as dimensões.

**Campos:**
- `decisao_id` (UUID): ID único da decisão
- `processo_id` (VARCHAR): Número do processo
- `magistrado_nome` (VARCHAR): Nome do magistrado
- `ano` (INTEGER): Ano da decisão
- `trimestre` (INTEGER): Trimestre (1-4)
- `mes` (INTEGER): Mês (1-12)
- `data_decisao` (DATE): Data da decisão
- `valor_em_disputa_brl` (DECIMAL): Valor em disputa
- `economia_gerada_brl` (DECIMAL): Economia gerada pela decisão
- `percentual_exito` (DECIMAL): Taxa de êxito (0-1)
- `count_favoravel` (INTEGER): 1 se favorável, 0 caso contrário
- `count_parcial` (INTEGER): 1 se parcialmente favorável, 0 caso contrário
- `count_desfavoravel` (INTEGER): 1 se desfavorável, 0 caso contrário
- `tribunal` (VARCHAR): Tribunal
- `camara_turma` (VARCHAR): Câmara/Turma
- `tema` (VARCHAR): Tema da decisão
- `tipo_decisao` (VARCHAR): Tipo (Sentença, Acórdão, etc.)
- `polo_cliente` (VARCHAR): Polo do cliente (Ativo/Passivo)
- `cliente` (VARCHAR): Nome do cliente

### Dimensões

#### `dim_magistrado`
- `nome`: Nome do magistrado
- `tribunal`: Tribunal onde atua
- `camara_turma`: Câmara/Turma

#### `dim_tribunal`
- `tribunal`: Nome do tribunal
- `esfera`: Superior, Federal, Estadual ou Outro

#### `dim_tema`
- `tema_normalizado`: Tema da decisão

## 📈 Medidas DAX Sugeridas

### Taxa de Êxito Ponderada
```dax
Taxa de Êxito = 
VAR Favoraveis = CALCULATE(COUNTROWS(fato_decisao), fato_decisao[count_favoravel] = 1)
VAR Parciais   = CALCULATE(COUNTROWS(fato_decisao), fato_decisao[count_parcial] = 1)
VAR Total      = CALCULATE(COUNTROWS(fato_decisao))
RETURN DIVIDE(Favoraveis + (0.5 * Parciais), Total, 0)
```

### Economia Total
```dax
Economia Total (BRL) = SUM(fato_decisao[economia_gerada_brl])
```

### Valor Médio em Disputa
```dax
Valor Médio em Disputa = AVERAGE(fato_decisao[valor_em_disputa_brl])
```

### Taxa de Sucesso por Magistrado
```dax
Taxa Sucesso Magistrado = 
DIVIDE(
    CALCULATE(
        COUNTROWS(fato_decisao),
        fato_decisao[count_favoravel] = 1
    ) + 
    CALCULATE(
        COUNTROWS(fato_decisao),
        fato_decisao[count_parcial] = 1
    ) * 0.5,
    COUNTROWS(fato_decisao),
    0
)
```

### Total de Decisões
```dax
Total Decisões = COUNTROWS(fato_decisao)
```

### Economia por Polo
```dax
Economia Polo Ativo = 
CALCULATE(
    SUM(fato_decisao[economia_gerada_brl]),
    fato_decisao[polo_cliente] = "Ativo"
)

Economia Polo Passivo = 
CALCULATE(
    SUM(fato_decisao[economia_gerada_brl]),
    fato_decisao[polo_cliente] = "Passivo"
)
```

## 🔗 Conexão com Power BI

### Passo 1: Conectar ao Supabase

1. No Power BI Desktop, clique em "Obter Dados"
2. Selecione "PostgreSQL database"
3. Insira as credenciais do Supabase:
   - **Server**: `db.{PROJECT_ID}.supabase.co`
   - **Database**: `postgres`
   - **Port**: `5432`

### Passo 2: Importar Views

1. Na lista de tabelas, selecione:
   - `fato_decisao`
   - `dim_magistrado`
   - `dim_tribunal`
   - `dim_tema`

2. Clique em "Carregar"

### Passo 3: Criar Relacionamentos

No modelo de dados, crie os seguintes relacionamentos:

- `fato_decisao[magistrado_nome]` → `dim_magistrado[nome]` (N:1)
- `fato_decisao[tribunal]` → `dim_tribunal[tribunal]` (N:1)
- `fato_decisao[tema]` → `dim_tema[tema_normalizado]` (N:1)

## 📊 Dashboards Sugeridos

### Dashboard 1: Visão Geral
- **KPIs Principais:**
  - Total de Decisões
  - Taxa de Êxito Geral
  - Economia Total Gerada
  - Valor Médio em Disputa

- **Gráficos:**
  - Linha do tempo (decisões por mês)
  - Pizza (distribuição por resultado)
  - Barras (top 10 magistrados por volume)
  - Barras (economia por tribunal)

### Dashboard 2: Análise por Magistrado
- **Filtros:**
  - Seletor de Magistrado
  - Período (data range)
  
- **Visualizações:**
  - Taxa de sucesso do magistrado
  - Temas mais julgados
  - Distribuição de resultados
  - Economia gerada
  - Comparação com média geral

### Dashboard 3: Análise por Tribunal/Câmara
- **Filtros:**
  - Tribunal
  - Câmara/Turma
  - Período

- **Visualizações:**
  - Distribuição de decisões por esfera
  - Taxa de sucesso por tribunal
  - Volume de decisões por câmara
  - Economia por tribunal

### Dashboard 4: Análise Temática
- **Filtros:**
  - Tema
  - Tipo de decisão
  
- **Visualizações:**
  - Temas mais recorrentes
  - Taxa de sucesso por tema
  - Valor médio em disputa por tema
  - Tribunal com melhor performance por tema

## 🔄 Atualização de Dados

### Atualização Manual
No Power BI Desktop, clique em "Atualizar" na faixa de opções.

### Atualização Automática (Power BI Service)
1. Publique o relatório no Power BI Service
2. Configure um gateway de dados local (se necessário)
3. Configure a atualização programada:
   - Vá em "Configurações" → "Conjuntos de dados"
   - Configure "Atualização agendada"
   - Escolha frequência (diária, semanal, etc.)

## 📝 Boas Práticas

1. **Performance:**
   - Use DirectQuery para dados em tempo real
   - Use Import para melhor performance em dashboards

2. **Segurança:**
   - Use credenciais de leitura apenas (read-only)
   - Configure RLS (Row-Level Security) se necessário

3. **Manutenção:**
   - Documente todas as medidas DAX criadas
   - Use convenção de nomes clara
   - Organize visuais em grupos lógicos

## 📞 Suporte

Para dúvidas ou problemas com a integração Power BI:
- Consulte a documentação do Supabase
- Verifique os logs de conexão
- Teste as queries SQL diretamente no banco de dados
