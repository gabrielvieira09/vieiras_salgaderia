-- 🔧 Correção para Tabela Profiles - Vieira's Salgaderia
-- Execute este script para corrigir o erro "null value in column id"

-- 1. Verificar se a tabela profiles existe e sua estrutura atual
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Fazer backup dos dados existentes (se houver)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    -- Criar tabela de backup se há dados
    IF EXISTS (SELECT 1 FROM profiles) THEN
      DROP TABLE IF EXISTS profiles_backup;
      CREATE TABLE profiles_backup AS SELECT * FROM profiles;
      RAISE NOTICE 'Backup da tabela profiles criado';
    END IF;
  END IF;
END $$;

-- 3. Recriar a tabela profiles com estrutura correta
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

-- 4. Restaurar dados do backup (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles_backup' AND table_schema = 'public') THEN
    INSERT INTO profiles (user_id, name, email, phone, street, neighborhood, number, cep, is_admin, purchases, created_at, updated_at)
    SELECT user_id, name, email, phone, street, neighborhood, number, cep, is_admin, purchases, created_at, updated_at
    FROM profiles_backup;
    
    RAISE NOTICE 'Dados restaurados do backup';
    DROP TABLE profiles_backup;
  END IF;
END $$;

-- 5. Recriar políticas RLS para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver e editar seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON profiles;

-- Criar políticas corretas
CREATE POLICY "Usuários podem ver e editar seu próprio perfil" ON profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os perfis" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- 6. Recriar trigger para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Recriar relacionamentos com outras tabelas
-- Carts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'carts' AND table_schema = 'public') THEN
    -- Verificar se a constraint existe antes de tentar removê-la
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'carts' AND constraint_type = 'FOREIGN KEY'
    ) THEN
      ALTER TABLE carts DROP CONSTRAINT IF EXISTS carts_user_id_fkey;
      ALTER TABLE carts DROP CONSTRAINT IF EXISTS fk_carts_user_id;
    END IF;
    
    ALTER TABLE carts ADD CONSTRAINT fk_carts_user_id 
      FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Relacionamento carts -> profiles recriado';
  END IF;
END $$;

-- Orders
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'orders' AND constraint_type = 'FOREIGN KEY'
    ) THEN
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_user_id;
    END IF;
    
    ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id 
      FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Relacionamento orders -> profiles recriado';
  END IF;
END $$;

-- Reviews
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews' AND table_schema = 'public') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'reviews' AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%user_id%'
    ) THEN
      ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
      ALTER TABLE reviews DROP CONSTRAINT IF EXISTS fk_reviews_user_id;
    END IF;
    
    ALTER TABLE reviews ADD CONSTRAINT fk_reviews_user_id 
      FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Relacionamento reviews -> profiles recriado';
  END IF;
END $$;

-- 8. Verificar a estrutura final
SELECT 
  'Tabela profiles corrigida!' as status,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Verificar relacionamentos
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (tc.table_name IN ('carts', 'orders', 'reviews') OR ccu.table_name = 'profiles')
ORDER BY tc.table_name;

-- 10. Testar inserção de perfil
-- DESCOMENTE APENAS PARA TESTE:
-- INSERT INTO profiles (user_id, name, email, is_admin) VALUES 
-- (gen_random_uuid(), 'Teste', 'teste@teste.com', false);

COMMIT; 