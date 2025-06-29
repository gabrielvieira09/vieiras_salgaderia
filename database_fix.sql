-- 🔧 Script de Correção Rápida - Vieira's Salgaderia
-- Execute este script se encontrar erro "ON CONFLICT specification"

-- 1. Primeiro, adicionar constraint única para o nome do produto (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'products' 
    AND constraint_name = 'unique_product_name'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT unique_product_name UNIQUE (name);
    RAISE NOTICE 'Constraint única para nome do produto criada';
  ELSE
    RAISE NOTICE 'Constraint única para nome do produto já existe';
  END IF;
END $$;

-- 2. Inserir produtos apenas se não existirem (método alternativo)
DO $$
BEGIN
  -- Inserir produtos apenas se a tabela estiver vazia
  IF (SELECT COUNT(*) FROM products) = 0 THEN
    INSERT INTO products (name, description, price, category, stock, image) VALUES
      ('Coxinha de Frango', 'Deliciosa coxinha recheada com frango desfiado temperado', 3.50, 'Fritos', 50, '/placeholder.svg'),
      ('Pastel de Queijo', 'Pastel crocante recheado com queijo derretido', 4.00, 'Fritos', 40, '/placeholder.svg'),
      ('Kibe Frito', 'Kibe tradicional com carne moída e temperos especiais', 3.00, 'Fritos', 30, '/placeholder.svg'),
      ('Esfiha de Carne', 'Esfiha aberta com carne temperada e cebola', 3.50, 'Assados', 35, '/placeholder.svg'),
      ('Pão de Açúcar', 'Pãozinho doce com cobertura de açúcar cristal', 2.50, 'Doces', 25, '/placeholder.svg'),
      ('Empada de Frango', 'Empada assada com recheio cremoso de frango', 4.50, 'Assados', 20, '/placeholder.svg'),
      ('Brigadeiro Gourmet', 'Brigadeiro artesanal com chocolate belga', 2.00, 'Doces', 60, '/placeholder.svg'),
      ('Enrolado de Salsicha', 'Massa folhada recheada com salsicha', 4.00, 'Assados', 25, '/placeholder.svg');
    
    RAISE NOTICE '8 produtos inseridos com sucesso';
  ELSE
    RAISE NOTICE 'Produtos já existem na tabela (% produtos encontrados)', (SELECT COUNT(*) FROM products);
  END IF;
END $$;

-- 3. Inserir produtos individuais se alguns não existirem
INSERT INTO products (name, description, price, category, stock, image) 
SELECT 'Coxinha de Frango', 'Deliciosa coxinha recheada com frango desfiado temperado', 3.50, 'Fritos', 50, '/placeholder.svg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Coxinha de Frango');

INSERT INTO products (name, description, price, category, stock, image) 
SELECT 'Pastel de Queijo', 'Pastel crocante recheado com queijo derretido', 4.00, 'Fritos', 40, '/placeholder.svg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Pastel de Queijo');

INSERT INTO products (name, description, price, category, stock, image) 
SELECT 'Kibe Frito', 'Kibe tradicional com carne moída e temperos especiais', 3.00, 'Fritos', 30, '/placeholder.svg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Kibe Frito');

INSERT INTO products (name, description, price, category, stock, image) 
SELECT 'Esfiha de Carne', 'Esfiha aberta com carne temperada e cebola', 3.50, 'Assados', 35, '/placeholder.svg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Esfiha de Carne');

INSERT INTO products (name, description, price, category, stock, image) 
SELECT 'Pão de Açúcar', 'Pãozinho doce com cobertura de açúcar cristal', 2.50, 'Doces', 25, '/placeholder.svg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Pão de Açúcar');

INSERT INTO products (name, description, price, category, stock, image) 
SELECT 'Empada de Frango', 'Empada assada com recheio cremoso de frango', 4.50, 'Assados', 20, '/placeholder.svg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Empada de Frango');

INSERT INTO products (name, description, price, category, stock, image) 
SELECT 'Brigadeiro Gourmet', 'Brigadeiro artesanal com chocolate belga', 2.00, 'Doces', 60, '/placeholder.svg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Brigadeiro Gourmet');

INSERT INTO products (name, description, price, category, stock, image) 
SELECT 'Enrolado de Salsicha', 'Massa folhada recheada com salsicha', 4.00, 'Assados', 25, '/placeholder.svg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Enrolado de Salsicha');

-- 4. Verificar quantos produtos foram inseridos
SELECT 
  'Produtos inseridos com sucesso!' as status,
  COUNT(*) as total_produtos,
  COUNT(CASE WHEN category = 'Fritos' THEN 1 END) as fritos,
  COUNT(CASE WHEN category = 'Assados' THEN 1 END) as assados,
  COUNT(CASE WHEN category = 'Doces' THEN 1 END) as doces
FROM products;

-- 5. Mostrar todos os produtos por categoria
SELECT 
  category,
  name,
  price,
  stock,
  created_at
FROM products 
ORDER BY category, name; 