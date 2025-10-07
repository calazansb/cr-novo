# Dashboard Principal Customizável

## 📊 Visão Geral

O Dashboard Customizável permite que cada usuário personalize sua visualização do sistema, adicionando, removendo e reorganizando widgets de acordo com suas necessidades e preferências.

## ✨ Funcionalidades

### 1. **Adicionar Widgets**
- Interface intuitiva com modal de seleção de widgets
- 7 tipos diferentes de widgets disponíveis
- Indicador visual de widgets já adicionados
- Descrição clara de cada widget antes de adicionar

### 2. **Remover Widgets**
- Botão de remoção aparece ao passar o mouse sobre o widget
- Confirmação visual com toast notification
- Widget removido instantaneamente

### 3. **Reorganizar Widgets (Drag and Drop)**
- Arraste qualquer widget para uma nova posição
- Feedback visual durante o arraste (opacidade reduzida)
- Posições salvas automaticamente
- Layout responsivo que se adapta ao movimento

### 4. **Persistência de Preferências**
- Configurações salvas automaticamente no localStorage
- Configurações individuais por usuário
- Widgets mantêm posição entre sessões
- Restauração automática ao fazer login

## 🎨 Widgets Disponíveis

### 1. **Visão Geral de Estatísticas** (Grande)
- Mostra totais de solicitações:
  - Pendentes (amarelo)
  - Concluídas (verde)
  - Total (azul)
- Atualização em tempo real
- Layout visual com cards coloridos

### 2. **Solicitações Recentes** (Médio)
- Lista das 5 últimas solicitações
- Exibe código único e cliente
- Badge colorido por status
- Scroll para mais itens
- Hover effect para interatividade

### 3. **Gráfico de Status** (Médio)
- Barras de progresso visuais
- Distribuição de pendentes vs concluídas
- Percentuais calculados automaticamente
- Cores semânticas (amarelo para pendente, verde para concluído)

### 4. **Ações Rápidas** (Pequeno)
- Atalhos para funções principais:
  - Nova Solicitação
  - Relatórios
  - Equipe
- Botões com ícones descritivos

### 5. **Prazos Próximos** (Médio)
- Visualização de prazos futuros
- Calendário de audiências
- *Em desenvolvimento - placeholder*

### 6. **Alertas e Notificações** (Pequeno)
- Avisos importantes
- Lembretes do sistema
- Contador de itens pendentes
- Ícone de alerta colorido

### 7. **Atividade da Equipe** (Médio)
- Últimas ações dos membros
- Status online/offline
- *Em desenvolvimento - placeholder*

## 🎯 Como Usar

### Acessar o Dashboard
1. Faça login no sistema
2. Clique em "Meu Dashboard" no menu lateral
3. Seu dashboard personalizado será exibido

### Adicionar um Widget
1. Clique no botão **"+ Adicionar Widget"** no topo da página
2. Navegue pelos widgets disponíveis no modal
3. Leia a descrição de cada widget
4. Clique no widget desejado para adicioná-lo
5. O widget aparecerá imediatamente no dashboard
6. Widgets já adicionados são marcados com ✓

### Remover um Widget
1. Passe o mouse sobre o widget que deseja remover
2. Clique no botão **X** que aparece no canto superior direito
3. O widget será removido instantaneamente
4. Uma notificação confirmará a remoção

### Reorganizar Widgets
1. Clique e segure no ícone de **seis pontos** (⋮⋮) no topo de qualquer widget
2. Arraste o widget para a nova posição desejada
3. Os outros widgets se reorganizarão automaticamente
4. Solte o mouse para fixar a nova posição
5. A nova ordem é salva automaticamente

### Resetar para Padrão
Se desejar retornar ao layout padrão:
1. Remova todos os widgets manualmente
2. Recarregue a página
3. Os 3 widgets padrão serão restaurados:
   - Visão Geral de Estatísticas
   - Solicitações Recentes
   - Ações Rápidas

## 🔧 Características Técnicas

### Tamanhos de Widget
- **Pequeno**: 1 coluna (mobile: tela cheia)
- **Médio**: 2 colunas (mobile: tela cheia)
- **Grande**: 3 colunas (mobile: tela cheia)

### Layout Responsivo
- **Desktop (>768px)**: Grid de 3 colunas
- **Mobile (<768px)**: 1 coluna (widgets empilhados)
- Transições suaves entre breakpoints

### Performance
- Carregamento rápido de dados
- Atualizações otimizadas
- Cache eficiente de preferências
- Minimal re-renders

### Integração com Backend
- Conectado à tabela `solicitacoes_controladoria`
- Estatísticas calculadas em tempo real
- Consultas otimizadas com limite de registros
- Ordenação por data mais recente

## 🎨 Design System

### Cores Semânticas
- **Pendente**: Amarelo/Warning (`text-warning`)
- **Concluído**: Verde/Success (`text-success`)
- **Total/Primário**: Azul/Primary (`text-primary`)
- **Alertas**: Vermelho/Destructive (`text-destructive`)

### Animações
- Fade-in na entrada (`animate-fade-in`)
- Hover lift em cards (`hover-lift`)
- Shadow glow em elementos ativos (`shadow-glow`)
- Transições suaves (300ms)

### Acessibilidade
- Ícones descritivos em todos os widgets
- Feedback visual claro para ações
- Contraste adequado de cores
- Suporte a navegação por teclado

## 📱 Experiência Mobile

- Dashboard totalmente responsivo
- Widgets empilhados verticalmente
- Touch-friendly (sem drag and drop no mobile)
- Botões de tamanho adequado para toque
- Modal de seleção otimizado para telas pequenas

## 🔮 Funcionalidades Futuras

### Em Desenvolvimento
1. **Gráficos Interativos**
   - Charts com dados históricos
   - Filtros de período
   - Exportação de relatórios

2. **Widgets de Calendário**
   - Visualização de prazos
   - Integração com audiências
   - Alertas de vencimento

3. **Atividade em Tempo Real**
   - WebSocket para atualizações live
   - Notificações push
   - Chat integrado

4. **Customização Avançada**
   - Cores personalizadas
   - Tamanhos ajustáveis
   - Configurações por widget

5. **Templates Prontos**
   - Dashboards pré-configurados por função
   - Importar/Exportar configurações
   - Compartilhar layouts

## 💡 Dicas de Uso

### Para Advogados
Recomendamos:
- Visão Geral de Estatísticas
- Solicitações Recentes
- Prazos Próximos
- Ações Rápidas

### Para Gestores
Recomendamos:
- Visão Geral de Estatísticas
- Gráfico de Status
- Atividade da Equipe
- Alertas e Notificações

### Para Administrativo
Recomendamos:
- Solicitações Recentes
- Ações Rápidas
- Prazos Próximos
- Alertas e Notificações

## 🐛 Resolução de Problemas

### Widgets não aparecem após adicionar
- Verifique se há rolagem na página
- Tente recarregar a página
- Limpe o cache do navegador

### Não consigo arrastar widgets
- Certifique-se de clicar no ícone de seis pontos
- Verifique se está usando desktop (mobile não suporta drag)
- Tente recarregar a página

### Configurações não são salvas
- Verifique se o localStorage está habilitado
- Não use modo anônimo do navegador
- Limpe dados antigos do localStorage

### Dados não atualizam
- Verifique conexão com internet
- Recarregue a página
- Verifique se há erros no console do navegador

## 📚 Recursos Adicionais

- **Suporte**: Entre em contato com o administrador
- **Documentação**: Consulte este arquivo
- **Vídeo Tutorial**: *Em produção*

## 🔐 Privacidade e Segurança

- Preferências salvas localmente no navegador
- Dados de solicitações protegidos por RLS
- Acesso controlado por autenticação
- Sem compartilhamento de dados entre usuários

---

**Versão**: 1.0.0  
**Última Atualização**: 2025-01-07  
**Autor**: Sistema CRA - Calazans Rossi Advogados
