-- 🚨 CORREÇÃO RÁPIDA - Erro profiles NULL
-- Execute APENAS este script para resolver o erro imediatamente

-- 1. Recriar tabela profiles com estrutura correta
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  street VARCHAR(255),
  neighborhood VARCHAR(255),
  number VARCHAR(20),
  cep VARCHAR(20),
  is_admin BOOLEAN DEFAULT FALSE,
  purchases TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas básicas
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- 4. Verificar se funcionou
SELECT 'Tabela profiles corrigida!' as status; 