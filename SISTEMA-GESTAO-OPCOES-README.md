# Sistema de Gestão de Opções de Dropdowns (Admin Only)

## 📋 Visão Geral

Sistema completo de gerenciamento de opções para todos os componentes select/dropdown da aplicação, com acesso exclusivo para administradores. Permite criar, editar, ativar/desativar e remover opções de forma centralizada, com auditoria completa e versionamento.

## 🎯 Funcionalidades Principais

### Para Administradores
- ✅ **"Criar e Editar..."** em todos os dropdowns (último item, visível apenas para admin)
- ✅ **Modal de Gestão** com CRUD completo de opções
- ✅ **Busca e filtros** nas opções existentes
- ✅ **Ativar/Desativar** opções sem removê-las
- ✅ **Soft Delete** (opções deletadas podem ser restauradas)
- ✅ **Ordenação** customizada das opções
- ✅ **Auditoria completa** de todas as alterações
- ✅ **Versionamento** de snapshots por conjunto

### Para Usuários Normais
- ✅ Veem apenas opções **ativas**
- ✅ Alterações feitas por admin aparecem **imediatamente**
- ✅ Não têm acesso ao modal de gestão
- ✅ Interface limpa e simples

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

#### 1. `option_sets` - Catálogo de Conjuntos
```sql
{
  id: UUID (PK),
  key: TEXT (UNIQUE) - Ex: "tipo_solicitacao", "tribunais"
  label: TEXT - Nome amigável para exibição
  description: TEXT - Descrição do conjunto
  created_at, updated_at
}
```

#### 2. `option_items` - Itens de Cada Conjunto
```sql
{
  id: UUID (PK),
  option_set_id: UUID (FK),
  label: TEXT - Exibição para o usuário
  value: TEXT - Valor interno (slug)
  order: INTEGER - Ordem de exibição
  is_active: BOOLEAN - Se está ativo
  is_default: BOOLEAN - Se é padrão
  meta: JSONB - Metadados extras
  deleted_at: TIMESTAMP - Soft delete
  created_at, updated_at
}
```

#### 3. `option_audit_logs` - Auditoria
```sql
{
  id: UUID (PK),
  option_set_id: UUID (FK),
  option_item_id: UUID (FK),
  actor_user_id: UUID (FK) - Quem fez a alteração
  action: ENUM - CREATE|UPDATE|DELETE|ACTIVATE|DEACTIVATE|REORDER
  before: JSONB - Estado anterior
  after: JSONB - Estado posterior
  created_at
}
```

#### 4. `option_versions` - Versionamento
```sql
{
  id: UUID (PK),
  option_set_id: UUID (FK),
  version: INTEGER - Número da versão
  snapshot: JSONB - Snapshot completo das opções
  actor_user_id: UUID (FK),
  created_at
}
```

### Políticas RLS (Row Level Security)

- **Usuários autenticados**: Podem ver apenas option_items ativos
- **Admins**: Acesso total (SELECT, INSERT, UPDATE, DELETE)
- **Segurança**: Validação server-side via função `is_admin()`

## 🎨 Componentes Front-End

### 1. `SelectWithAdminEdit`
Componente reutilizável para dropdowns com gestão admin.

**Props:**
```typescript
{
  optionSetKey: string;      // Ex: "tipo_solicitacao"
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isAdmin?: boolean;         // Se mostra opção de gestão
  label?: string;
  className?: string;
}
```

**Uso:**
```tsx
<SelectWithAdminEdit
  optionSetKey="tipo_solicitacao"
  value={formData.tipoSolicitacao}
  onValueChange={(value) => setFormData({...formData, tipoSolicitacao: value})}
  placeholder="Selecione o tipo"
  isAdmin={isAdmin}
  label="Tipo de Solicitação"
/>
```

### 2. `OptionAdminModal`
Modal completo de gestão de opções (apenas admin).

**Funcionalidades:**
- ✅ Criar nova opção
- ✅ Editar opção existente
- ✅ Ativar/Desativar opção
- ✅ Remover opção (soft delete)
- ✅ Busca em tempo real
- ✅ Validação de campos
- ✅ Geração automática de slugs
- ✅ Ordenação visual

### 3. `useOptionItems` Hook
Hook customizado para gerenciar opções.

**Retorno:**
```typescript
{
  optionSet: OptionSet;        // Informações do conjunto
  items: OptionItem[];         // Lista de itens
  isLoading: boolean;
  error: Error | null;
  createItem: (item) => void;
  updateItem: (id, updates) => void;
  deleteItem: (id) => void;
  toggleActive: (id, isActive) => void;
  reorderItems: (orderedIds) => void;
  isCreating, isUpdating, isDeleting: boolean;
}
```

## 🔐 Segurança

### Verificação de Admin
```typescript
const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  const checkAdmin = async () => {
    if (user?.id) {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      setIsAdmin(!!data);
    }
  };
  checkAdmin();
}, [user?.id]);
```

### Proteções Implementadas
- ✅ **Server-side validation**: RLS policies impedem acesso não autorizado
- ✅ **RBAC**: Função `is_admin()` com SECURITY DEFINER
- ✅ **Input validation**: Sanitização de slugs e validação de unicidade
- ✅ **Auditoria**: Todos os CRUDs são registrados com usuário e timestamp
- ✅ **Soft delete**: Dados nunca são perdidos permanentemente

## 📊 Conjuntos Pré-Configurados

### 1. `tipo_solicitacao`
Tipos de solicitações para o Balcão da Controladoria:
- Documentação
- Consulta Jurídica
- Revisão de Contrato
- Petição
- Recurso
- Certidões
- Análise de Processo
- Outros

### 2. `status_solicitacao`
Status possíveis para solicitações:
- Pendente (padrão)
- Em Andamento
- Concluída
- Cancelada

### 3. `tribunais`
Tribunais e órgãos jurisdicionais (vazio inicialmente, para admin preencher)

### 4. `especialidades`
Áreas de especialização jurídica (vazio inicialmente)

## 🚀 Como Adicionar Novo Dropdown Gerenciável

### Passo 1: Criar o Option Set
```sql
INSERT INTO option_sets (key, label, description) 
VALUES ('meu_conjunto', 'Meu Conjunto', 'Descrição do conjunto');
```

### Passo 2: (Opcional) Adicionar Itens Iniciais
```sql
INSERT INTO option_items (option_set_id, label, value, "order", is_active)
SELECT 
  (SELECT id FROM option_sets WHERE key = 'meu_conjunto'),
  'Item 1', 'item_1', 1, true;
```

### Passo 3: Usar no Componente
```tsx
<SelectWithAdminEdit
  optionSetKey="meu_conjunto"
  value={value}
  onValueChange={setValue}
  isAdmin={isAdmin}
  placeholder="Selecione..."
/>
```

## 🎨 Customização e Estilo

### Responsividade
- ✅ Modal **full-screen** em mobile
- ✅ Modal **lg** (max-w-4xl) em desktop
- ✅ Tabela com **scroll horizontal** quando necessário

### Acessibilidade (A11y)
- ✅ **Focus trap** no modal
- ✅ **Navegação por teclado** (Tab, Enter, Esc)
- ✅ **ARIA labels** adequados
- ✅ **Retorno de foco** ao elemento chamador

### i18n Ready
Todos os textos estão prontos para internacionalização:
```typescript
const labels = {
  'pt-BR': {
    title: 'Gerenciar Opções',
    create: 'Nova Opção',
    edit: 'Editar',
    delete: 'Remover',
    // ...
  }
}
```

## 📝 Validações

### Campos Obrigatórios
- ✅ `label`: 1-120 caracteres
- ✅ `value`: Gerado automaticamente se vazio, deve ser único no conjunto
- ✅ `order`: Inteiro ≥ 0

### Regras de Negócio
- ✅ **Unicidade**: Não pode haver dois valores iguais no mesmo conjunto
- ✅ **Slugify automático**: Acentos removidos, espaços viram underscore
- ✅ **Soft delete**: Itens deletados ficam ocultos mas não são removidos do BD

## 🧪 Testes Recomendados

### Unitários
- [ ] Validação de input (label, value, order)
- [ ] Função slugify
- [ ] Verificação de RBAC (admin vs user)

### Integração
- [ ] CRUD completo via API
- [ ] Auditoria sendo criada corretamente
- [ ] Versionamento funcionando

### E2E (Playwright/Cypress)
- [ ] Admin vê "Criar e Editar...", user não vê
- [ ] Modal abre e fecha corretamente
- [ ] CRUD reflete no dropdown imediatamente
- [ ] Itens inativos não aparecem para não-admin
- [ ] Focus retorna ao elemento correto

## 📈 Melhorias Futuras

### Funcionalidades
- [ ] **Drag & drop** para reordenar itens visualmente
- [ ] **Importar/Exportar** opções em massa (CSV/JSON)
- [ ] **Restaurar versões** antigas de conjuntos
- [ ] **Duplicar opções** existentes
- [ ] **Metadados customizados** (ícones, cores, tags) via UI

### Performance
- [ ] **Paginação** para conjuntos muito grandes (>100 itens)
- [ ] **Cache** mais agressivo com SWR/React Query
- [ ] **Lazy loading** de option sets não utilizados

### Admin UX
- [ ] **Histórico de alterações** visível no modal
- [ ] **Preview** de como ficará para usuário normal
- [ ] **Bulk actions** (ativar/desativar múltiplos)
- [ ] **Permissões granulares** por conjunto

## 🐛 Troubleshooting

### "Opções não aparecem"
- ✅ Verificar se `is_active = true`
- ✅ Verificar se `deleted_at IS NULL`
- ✅ Verificar RLS policies
- ✅ Verificar se hook está com `activeOnly: true`

### "Não consigo criar opção"
- ✅ Verificar se usuário é admin
- ✅ Verificar unicidade do `value`
- ✅ Verificar se `label` não está vazio
- ✅ Ver logs de auditoria para detalhes

### "Modal não abre"
- ✅ Verificar se `isAdmin === true`
- ✅ Verificar console para erros
- ✅ Verificar se option set existe no banco

## 📚 Referências

- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **React Query**: https://tanstack.com/query/latest
- **Shadcn/ui**: https://ui.shadcn.com/
- **Zod Validation**: https://zod.dev/

## 👥 Suporte

Para dúvidas ou problemas:
1. Verificar logs de auditoria no banco
2. Consultar console do navegador
3. Revisar políticas RLS
4. Verificar se usuário tem role de admin

---

**Versão**: 1.0.0  
**Data**: 2025-10-08  
**Autor**: Sistema CRA - Calazans Rossi Advogados
