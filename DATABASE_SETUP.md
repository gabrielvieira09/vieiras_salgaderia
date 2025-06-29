# 🗄️ Configuração do Banco de Dados - Vieira's Salgaderia

Este guia explica como configurar o banco de dados Supabase para o projeto funcionar corretamente.

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto criado no Supabase
3. Variáveis de ambiente configuradas no `.env.local`

## ⚡ Soluções Rápidas para Erros Comuns

### 🔴 Se você recebeu erro "null value in column id of relation profiles":
1. **EXECUTE**: `fix_profiles_quick.sql` ⚡ (correção instantânea)
2. Depois teste o cadastro novamente

### 🔴 Se você recebeu erro "ON CONFLICT specification":
1. Execute o arquivo `database_fix.sql` primeiro
2. Depois execute o `database_schema.sql`

### 🔴 Se você recebeu erro "Could not find a relationship":
1. Execute o `database_schema.sql` completo
2. Verifique se todas as 7 tabelas foram criadas

### 🔴 Se algumas tabelas já existem:
1. Execute apenas as partes que faltam do script
2. Use `database_diagnostics.sql` para verificar o que já existe

---

## 🚀 Passo a Passo

### 1. Acessar o SQL Editor do Supabase

1. Faça login no [Supabase](https://supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor** na barra lateral
4. Clique em **New query**

### 2. Executar o Script de Configuração

1. Copie todo o conteúdo do arquivo `database_schema.sql`
2. Cole no SQL Editor do Supabase
3. Clique em **Run** ou pressione `Ctrl+Enter`

O script irá criar:
- ✅ Todas as tabelas necessárias
- ✅ Relacionamentos entre tabelas (foreign keys)
- ✅ Políticas de segurança (RLS)
- ✅ Triggers automáticos
- ✅ Função para decrementar estoque
- ✅ Dados de exemplo (produtos)

### 3. Criar Usuário Administrador

Após executar o script principal, você precisa criar um usuário admin:

#### 3.1. Criar usuário via Auth
1. Vá para **Authentication > Users**
2. Clique em **Add user**
3. Preencha:
   - **Email**: `admin@vieiras.com`
   - **Password**: `admin123`
   - **Email Confirm**: ✅ Marcado

#### 3.2. Tornar o usuário admin
1. Volte para o **SQL Editor**
2. Execute este comando (substitua `UUID_DO_USUARIO` pelo ID real):

```sql
-- Copie o UUID do usuário criado na aba Authentication
INSERT INTO profiles (user_id, name, email, is_admin) VALUES 
('UUID_DO_USUARIO_AQUI', 'Administrador', 'admin@vieiras.com', true)
ON CONFLICT (user_id) DO UPDATE SET is_admin = true;
```

### 4. Verificar Configuração

Execute estas queries para verificar se tudo foi criado corretamente:

```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar produtos inseridos
SELECT * FROM products;

-- Verificar relacionamentos
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

## 🔧 Configuração das Variáveis de Ambiente

Certifique-se de que seu arquivo `.env.local` está configurado:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

## 📂 Arquivos de Configuração

### Scripts Principais
- **`database_schema.sql`** - Script completo de configuração
- **`database_fix.sql`** - Correção para erro ON CONFLICT
- **`fix_profiles_quick.sql`** - ⚡ Correção rápida para erro de profiles
- **`database_profile_fix.sql`** - Correção avançada para profiles
- **`database_diagnostics.sql`** - Comandos de diagnóstico

### Qual Usar?
- **Erro profiles NULL**: `fix_profiles_quick.sql` ⚡
- **Erro ON CONFLICT**: `database_fix.sql`
- **Configuração completa**: `database_schema.sql`
- **Diagnóstico**: `database_diagnostics.sql`

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

1. **profiles** - Perfis dos usuários
2. **products** - Catálogo de produtos
3. **reviews** - Avaliações dos produtos
4. **carts** - Carrinhos dos usuários
5. **cart_items** - Itens dos carrinhos
6. **orders** - Pedidos realizados
7. **order_items** - Itens dos pedidos

### Relacionamentos

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
carts (1:1) → cart_items (1:N) → products
    ↓
orders (1:N) → order_items (1:N) → products
    ↓
reviews (N:1) → products
```

## 🛡️ Segurança (RLS)

O banco está configurado com Row Level Security (RLS) que garante:

- ✅ Usuários só veem seus próprios dados
- ✅ Admins podem gerenciar tudo
- ✅ Produtos são visíveis para todos
- ✅ Avaliações são públicas, mas só o autor pode editar

## 🧪 Dados de Teste

O script inclui 8 produtos de exemplo nas categorias:
- **Fritos**: Coxinha, Pastel, Kibe
- **Assados**: Esfiha, Empada, Enrolado
- **Doces**: Pão de Açúcar, Brigadeiro

## ❗ Solução de Problemas

### Erro: "null value in column id of relation profiles" 🚨 **CRÍTICO**
**Causa**: Estrutura incorreta da tabela profiles com coluna `id` duplicada.

**Solução IMEDIATA**:
1. Execute `fix_profiles_quick.sql` no SQL Editor
2. A tabela será recriada corretamente
3. Teste o cadastro novamente

### Erro: "ON CONFLICT specification" ⚠️ **COMUM**
**Causa**: Tentativa de usar ON CONFLICT sem constraint única.

**Solução Rápida**:
1. Execute o arquivo `database_fix.sql` no SQL Editor
2. OU execute este comando primeiro:
```sql
ALTER TABLE products ADD CONSTRAINT unique_product_name UNIQUE (name);
```
3. Depois execute o script principal `database_schema.sql`

### Erro: "Could not find a relationship"
- ✅ Execute o script `database_schema.sql` completo
- ✅ Verifique se todas as tabelas foram criadas
- ✅ Confirme os relacionamentos com a query de verificação

### Erro: "RLS is enabled but no policies"
- ✅ O script já inclui todas as políticas necessárias
- ✅ Verifique se o RLS foi habilitado corretamente

### Erro: "JWT claims missing"
- ✅ Verifique se o usuário está autenticado
- ✅ Confirme as variáveis de ambiente do Supabase

### Erro: "Duplicate key value violates unique constraint"
- ✅ Os produtos já foram inseridos
- ✅ Execute apenas as partes do script que faltam
- ✅ Use o arquivo `database_diagnostics.sql` para verificar

## 🎯 Próximos Passos

Após a configuração:

1. ✅ Teste o login com `admin@vieiras.com` / `admin123`
2. ✅ Verifique se os produtos aparecem na página inicial
3. ✅ Teste adicionar produtos ao carrinho
4. ✅ Faça um pedido de teste
5. ✅ Gere uma NFe PDF

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no console do navegador
2. Confirme a configuração do Supabase
3. Execute as queries de verificação
4. Certifique-se de que todas as tabelas foram criadas

---

✨ **Banco configurado com sucesso!** Agora você pode usar todas as funcionalidades do sistema. 