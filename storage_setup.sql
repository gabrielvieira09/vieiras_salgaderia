-- ================================================
-- CONFIGURAÇÃO SUPABASE STORAGE PARA IMAGENS
-- Execute este script no SQL Editor do Supabase
-- ================================================

-- 1. Criar bucket para imagens de produtos (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir que usuários autenticados façam upload
CREATE POLICY "Usuários autenticados podem fazer upload de imagens"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 3. Política para permitir que todos vejam as imagens (públicas)
CREATE POLICY "Qualquer um pode ver imagens de produtos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 4. Política para que admins possam deletar imagens
CREATE POLICY "Admins podem deletar imagens de produtos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- 5. Política para que usuários possam atualizar suas próprias imagens
CREATE POLICY "Usuários podem atualizar imagens que enviaram"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND owner = auth.uid());

-- ================================================
-- VERIFICAÇÃO DA CONFIGURAÇÃO
-- ================================================

-- Verificar se o bucket foi criado
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'product-images';

-- Verificar políticas criadas
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- ================================================
-- INSTRUÇÕES PARA USO
-- ================================================

/*
1. Execute este script no SQL Editor do Supabase
2. Verifique se o bucket foi criado na aba Storage
3. Teste o upload de uma imagem no frontend
4. As imagens serão acessíveis via URL pública:
   https://[seu-projeto].supabase.co/storage/v1/object/public/product-images/[nome-do-arquivo]

ESTRUTURA DE PASTAS:
- product-images/
  - products/
    - 1640995200000-abc123.jpg
    - 1640995300000-def456.png

FORMATOS SUPORTADOS:
- JPEG/JPG
- PNG  
- GIF
- WebP

TAMANHO MÁXIMO: 5MB por arquivo

POLÍTICAS DE SEGURANÇA:
✅ Usuários autenticados podem fazer upload
✅ Todos podem visualizar imagens (públicas)
✅ Admins podem deletar qualquer imagem
✅ Usuários podem atualizar suas próprias imagens
*/ 