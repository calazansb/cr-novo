# 📧 Templates de Email Personalizados - Calazans Rossi Advogados

Este projeto inclui templates de email totalmente personalizados para o sistema de autenticação, com a identidade visual da Calazans Rossi Advogados.

## 🎨 Templates Incluídos

### 1. **Email de Confirmação** (`confirmation.html`)
- **Quando é enviado**: Quando um novo usuário se cadastra
- **Propósito**: Verificar o endereço de email do usuário
- **Design**: Azul profissional com gradiente, logo e boas-vindas

### 2. **Email de Convite** (`invite.html`)
- **Quando é enviado**: Quando um administrador convida um novo advogado
- **Propósito**: Convidar usuários para se juntarem ao sistema
- **Design**: Verde elegante com informações sobre o sistema

### 3. **Email de Recuperação** (`recovery.html`)
- **Quando é enviado**: Quando um usuário esquece a senha
- **Propósito**: Redefinir senha com segurança
- **Design**: Vermelho para indicar urgência, com avisos de segurança

## 🚀 Como Configurar no Supabase

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. **Acesse o Dashboard do Supabase**
   - Vá para [supabase.com](https://supabase.com)
   - Entre no seu projeto

2. **Configure os Templates**
   - Navegue até **Authentication** → **Settings** → **Email Templates**
   - Para cada tipo de email (Confirm signup, Invite user, Reset password):
     - Clique em **Edit**
     - Copie o conteúdo HTML do template correspondente
     - Cole no campo **Message (HTML)**
     - Atualize o **Subject** conforme sugerido abaixo

### Opção 2: Via Arquivo de Configuração (Para desenvolvimento local)

Se você estiver usando o Supabase CLI localmente:

1. **Configure o arquivo `supabase/config.toml`** (já incluído)
2. **Execute o projeto localmente** com `supabase start`

## 📝 Subjects Sugeridos

```
Confirmação: "Bem-vindo ao Sistema Calazans Rossi - Confirme seu cadastro"
Convite: "Convite: Sistema Calazans Rossi Advogados"
Recuperação: "Recuperação de Senha - Sistema Calazans Rossi"
Magic Link: "Seu acesso ao Sistema Calazans Rossi"
Mudança de Email: "Confirmação de Mudança de Email - Calazans Rossi"
```

## 🎯 Características dos Templates

### ✅ Design Profissional
- Gradientes elegantes com as cores da marca
- Logo e identidade visual consistente
- Layout responsivo para mobile e desktop

### ✅ Experiência do Usuário
- Linguagem clara e profissional em português
- Instruções detalhadas sobre o sistema
- Botões de ação destacados e intuitivos

### ✅ Segurança
- Avisos sobre validade dos links
- Informações de segurança claras
- Instruções sobre o que fazer em caso de email não solicitado

### ✅ Informações Úteis
- Descrição dos recursos disponíveis no sistema
- Informações sobre a empresa e o sistema
- Contato e suporte quando necessário

## 🔧 Personalização Adicional

Para personalizar ainda mais os templates:

1. **Cores**: Edite as variáveis CSS nas tags `<style>`
2. **Logo**: Substitua o logo placeholder "CR" por uma imagem real
3. **Conteúdo**: Modifique textos e informações conforme necessário
4. **Recursos**: Atualize a lista de recursos do sistema

## 📱 Preview dos Templates

Os templates são totalmente responsivos e funcionam bem em:
- ✅ Desktop (Outlook, Gmail, Apple Mail)
- ✅ Mobile (aplicativos de email nativos)
- ✅ Webmail (Gmail web, Outlook web)

## 🆘 Suporte

Se precisar de ajuda com a configuração:
1. Verifique a documentação oficial do Supabase
2. Teste os templates em desenvolvimento primeiro
3. Use ferramentas de preview de email para verificar a renderização

---

**Desenvolvido com ❤️ para Calazans Rossi Advogados**  
*Sistema de Comunicação Jurídica v2.0*