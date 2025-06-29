-- Vieira's Salgaderia - Database Schema
-- Execute este script no SQL Editor do Supabase

-- 1. Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS profiles (
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

-- 2. Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image VARCHAR(500),
  category VARCHAR(100) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabela de avaliações
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(product_id, user_id) -- Garante que um usuário só pode avaliar uma vez por produto
);

-- 4. Tabela de carrinhos
CREATE TABLE IF NOT EXISTS carts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tabela de itens do carrinho
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(cart_id, product_id) -- Garante que um produto aparece apenas uma vez por carrinho
);

-- 6. Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_street VARCHAR(255),
  shipping_number VARCHAR(20),
  shipping_neighborhood VARCHAR(255),
  shipping_cep VARCHAR(20),
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Função para decrementar estoque
CREATE OR REPLACE FUNCTION decrement_product_stock(product_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET stock = stock - amount,
      updated_at = NOW()
  WHERE id = product_id AND stock >= amount;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado ou estoque insuficiente';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers nas tabelas
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_carts_updated_at ON carts;
CREATE TRIGGER update_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Políticas RLS (Row Level Security)

-- Habilitar RLS nas tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
DROP POLICY IF EXISTS "Usuários podem ver e editar seu próprio perfil" ON profiles;
CREATE POLICY "Usuários podem ver e editar seu próprio perfil" ON profiles
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON profiles;
CREATE POLICY "Admins podem ver todos os perfis" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Políticas para products
DROP POLICY IF EXISTS "Produtos são visíveis para todos" ON products;
CREATE POLICY "Produtos são visíveis para todos" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins podem gerenciar produtos" ON products;
CREATE POLICY "Admins podem gerenciar produtos" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Políticas para reviews
DROP POLICY IF EXISTS "Avaliações são visíveis para todos" ON reviews;
CREATE POLICY "Avaliações são visíveis para todos" ON reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem criar suas próprias avaliações" ON reviews;
CREATE POLICY "Usuários podem criar suas próprias avaliações" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem editar suas próprias avaliações" ON reviews;
CREATE POLICY "Usuários podem editar suas próprias avaliações" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias avaliações" ON reviews;
CREATE POLICY "Usuários podem deletar suas próprias avaliações" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para carts
DROP POLICY IF EXISTS "Usuários podem ver e gerenciar seu próprio carrinho" ON carts;
CREATE POLICY "Usuários podem ver e gerenciar seu próprio carrinho" ON carts
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para cart_items
DROP POLICY IF EXISTS "Usuários podem gerenciar itens do seu carrinho" ON cart_items;
CREATE POLICY "Usuários podem gerenciar itens do seu carrinho" ON cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM carts 
      WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
    )
  );

-- Políticas para orders
DROP POLICY IF EXISTS "Usuários podem ver seus próprios pedidos" ON orders;
CREATE POLICY "Usuários podem ver seus próprios pedidos" ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus próprios pedidos" ON orders;
CREATE POLICY "Usuários podem criar seus próprios pedidos" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins podem ver e gerenciar todos os pedidos" ON orders;
CREATE POLICY "Admins podem ver e gerenciar todos os pedidos" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Políticas para order_items
DROP POLICY IF EXISTS "Usuários podem ver itens dos seus pedidos" ON order_items;
CREATE POLICY "Usuários podem ver itens dos seus pedidos" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários podem criar itens nos seus pedidos" ON order_items;
CREATE POLICY "Usuários podem criar itens nos seus pedidos" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins podem ver e gerenciar todos os itens de pedidos" ON order_items;
CREATE POLICY "Admins podem ver e gerenciar todos os itens de pedidos" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- 11. Adicionar constraint única para o nome do produto
ALTER TABLE products ADD CONSTRAINT unique_product_name UNIQUE (name);

-- 12. Inserir dados de exemplo (produtos) apenas se não existirem
INSERT INTO products (name, description, price, category, stock, image) VALUES
  ('Coxinha de Frango', 'Deliciosa coxinha recheada com frango desfiado temperado', 3.50, 'Fritos', 50, '/placeholder.svg'),
  ('Pastel de Queijo', 'Pastel crocante recheado com queijo derretido', 4.00, 'Fritos', 40, '/placeholder.svg'),
  ('Kibe Frito', 'Kibe tradicional com carne moída e temperos especiais', 3.00, 'Fritos', 30, '/placeholder.svg'),
  ('Esfiha de Carne', 'Esfiha aberta com carne temperada e cebola', 3.50, 'Assados', 35, '/placeholder.svg'),
  ('Pão de Açúcar', 'Pãozinho doce com cobertura de açúcar cristal', 2.50, 'Doces', 25, '/placeholder.svg'),
  ('Empada de Frango', 'Empada assada com recheio cremoso de frango', 4.50, 'Assados', 20, '/placeholder.svg'),
  ('Brigadeiro Gourmet', 'Brigadeiro artesanal com chocolate belga', 2.00, 'Doces', 60, '/placeholder.svg'),
  ('Enrolado de Salsicha', 'Massa folhada recheada com salsicha', 4.00, 'Assados', 25, '/placeholder.svg')
ON CONFLICT (name) DO NOTHING;

-- 13. Criar usuário admin padrão
-- Nota: Você precisará criar o usuário no Supabase Auth primeiro e depois executar:
-- INSERT INTO profiles (user_id, name, email, is_admin) VALUES 
-- ('UUID_DO_USUARIO_ADMIN', 'Administrador', 'admin@vieiras.com', true)
-- ON CONFLICT (user_id) DO UPDATE SET is_admin = true;

COMMIT; 