-- 🔍 Comandos de Diagnóstico - Vieira's Salgaderia
-- Execute estes comandos para verificar e corrigir problemas no banco

-- ========================================
-- 1. VERIFICAÇÕES BÁSICAS
-- ========================================

-- Verificar se todas as tabelas foram criadas
SELECT 
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar relacionamentos de chave estrangeira
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Verificar se as políticas RLS estão ativas
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Listar políticas RLS criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 2. VERIFICAR DADOS
-- ========================================

-- Contar registros em cada tabela
SELECT 'profiles' as tabela, COUNT(*) as registros FROM profiles
UNION ALL
SELECT 'products' as tabela, COUNT(*) as registros FROM products
UNION ALL
SELECT 'reviews' as tabela, COUNT(*) as registros FROM reviews
UNION ALL
SELECT 'carts' as tabela, COUNT(*) as registros FROM carts
UNION ALL
SELECT 'cart_items' as tabela, COUNT(*) as registros FROM cart_items
UNION ALL
SELECT 'orders' as tabela, COUNT(*) as registros FROM orders
UNION ALL
SELECT 'order_items' as tabela, COUNT(*) as registros FROM order_items
ORDER BY tabela;

-- Verificar produtos por categoria
SELECT 
  category,
  COUNT(*) as quantidade,
  AVG(price) as preco_medio,
  SUM(stock) as estoque_total
FROM products 
GROUP BY category
ORDER BY category;

-- ========================================
-- 3. COMANDOS DE CORREÇÃO
-- ========================================

-- Recriar relação orders -> order_items (se necessário)
DO $$
BEGIN
  -- Verificar se a constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'order_items' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%order_id%'
  ) THEN
    -- Adicionar constraint se não existir
    ALTER TABLE order_items 
    ADD CONSTRAINT fk_order_items_order_id 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Constraint order_items -> orders criada com sucesso';
  ELSE
    RAISE NOTICE 'Constraint order_items -> orders já existe';
  END IF;
END $$;

-- Recriar todas as constraints importantes (se necessário)
DO $$
BEGIN
  -- Dropar constraints existentes (se houver problemas)
  BEGIN
    ALTER TABLE order_items DROP CONSTRAINT IF EXISTS fk_order_items_order_id;
    ALTER TABLE order_items DROP CONSTRAINT IF EXISTS fk_order_items_product_id;
    ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS fk_cart_items_cart_id;
    ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS fk_cart_items_product_id;
    ALTER TABLE reviews DROP CONSTRAINT IF EXISTS fk_reviews_product_id;
    ALTER TABLE reviews DROP CONSTRAINT IF EXISTS fk_reviews_user_id;
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_user_id;
    ALTER TABLE carts DROP CONSTRAINT IF EXISTS fk_carts_user_id;
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Algumas constraints não existiam para serem removidas';
  END;

  -- Recriar constraints
  ALTER TABLE profiles ADD CONSTRAINT fk_profiles_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
  ALTER TABLE carts ADD CONSTRAINT fk_carts_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
  ALTER TABLE cart_items ADD CONSTRAINT fk_cart_items_cart_id 
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE;
    
  ALTER TABLE cart_items ADD CONSTRAINT fk_cart_items_product_id 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    
  ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
  ALTER TABLE order_items ADD CONSTRAINT fk_order_items_order_id 
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
    
  ALTER TABLE order_items ADD CONSTRAINT fk_order_items_product_id 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    
  ALTER TABLE reviews ADD CONSTRAINT fk_reviews_product_id 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    
  ALTER TABLE reviews ADD CONSTRAINT fk_reviews_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  RAISE NOTICE 'Todas as constraints foram recriadas com sucesso';
END $$;

-- ========================================
-- 4. VERIFICAR USUÁRIOS E PERMISSÕES
-- ========================================

-- Listar usuários do sistema
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- Verificar perfis criados
SELECT 
  p.*,
  u.email as auth_email,
  u.created_at as auth_created_at
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
ORDER BY p.created_at DESC;

-- ========================================
-- 5. COMANDOS DE LIMPEZA (CUIDADO!)
-- ========================================

-- ATENÇÃO: Use apenas se necessário limpar dados de teste

-- Limpar carrinho de um usuário específico
-- UNCOMMENT APENAS SE NECESSÁRIO:
-- DELETE FROM cart_items WHERE cart_id IN (
--   SELECT id FROM carts WHERE user_id = 'UUID_DO_USUARIO'
-- );

-- Limpar todos os carrinhos (CUIDADO!)
-- UNCOMMENT APENAS SE NECESSÁRIO:
-- TRUNCATE cart_items, carts RESTART IDENTITY CASCADE;

-- Limpar pedidos de teste (CUIDADO!)
-- UNCOMMENT APENAS SE NECESSÁRIO:
-- TRUNCATE order_items, orders RESTART IDENTITY CASCADE;

-- ========================================
-- 6. RECRIAR ÍNDICES (PERFORMANCE)
-- ========================================

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ========================================
-- 7. TESTE DE FUNCIONALIDADES
-- ========================================

-- Testar inserção de avaliação (substitua os UUIDs)
-- INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES
-- (
--   (SELECT id FROM products LIMIT 1),
--   (SELECT id FROM auth.users LIMIT 1),
--   'Usuário Teste',
--   5,
--   'Produto excelente!'
-- );

-- Verificar se a média das avaliações funciona
SELECT 
  p.name,
  p.category,
  COUNT(r.id) as total_reviews,
  ROUND(AVG(r.rating::numeric), 2) as average_rating
FROM products p
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id, p.name, p.category
ORDER BY average_rating DESC NULLS LAST;

-- ========================================
-- 8. COMANDOS DE BACKUP
-- ========================================

-- Backup dos dados importantes (copie o resultado)
SELECT 'INSERT INTO products (id, name, description, price, category, stock, image) VALUES' as backup_header
UNION ALL
SELECT CONCAT(
  '(''', id, ''', ''', 
  REPLACE(name, '''', ''''''), ''', ''', 
  REPLACE(COALESCE(description, ''), '''', ''''''), ''', ', 
  price, ', ''', category, ''', ', stock, ', ''', 
  COALESCE(image, ''), '''),'
) as backup_data
FROM products
ORDER BY backup_header DESC;

-- Verificação final
SELECT 
  'Sistema configurado corretamente!' as status,
  COUNT(DISTINCT table_name) as tabelas_criadas
FROM information_schema.tables 
WHERE table_schema = 'public'
HAVING COUNT(DISTINCT table_name) >= 7; 