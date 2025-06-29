"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

interface ImagePickerProps {
  value?: string;
  onChange: (url: string) => void;
  error?: string;
}

export default function ImagePicker({ value, onChange, error }: ImagePickerProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor selecione apenas arquivos de imagem (JPG, PNG, etc.)');
      }

      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB');
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      console.log('📤 Fazendo upload da imagem:', { fileName, size: file.size, type: file.type });

      // Fazer upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        
        // Se o bucket não existe, tentar criar
        if (uploadError.message?.includes('Bucket not found')) {
          console.log('🪣 Bucket não encontrado, tentando criar...');
          await createProductImagesBucket();
          
          // Tentar upload novamente
          const { data: retryData, error: retryError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (retryError) throw retryError;
          console.log('✅ Upload realizado após criar bucket:', retryData);
        } else {
          throw uploadError;
        }
      }

      // Obter URL pública da imagem
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;
      console.log('🎉 Upload concluído:', imageUrl);

      // Atualizar o valor no formulário
      onChange(imageUrl);

    } catch (err) {
      console.error('💥 Erro no upload:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload da imagem';
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
      // Limpar input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    setUploadError(null);
  };

  const createProductImagesBucket = async () => {
    try {
      console.log('🪣 Criando bucket product-images...');
      
      const { data, error } = await supabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (error) {
        console.error('❌ Erro ao criar bucket:', error);
        throw error;
      }

      console.log('✅ Bucket criado com sucesso:', data);
    } catch (err) {
      console.error('💥 Erro ao criar bucket:', err);
      throw new Error('Erro ao configurar storage de imagens. Entre em contato com o administrador.');
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview da imagem atual */}
      {value && (
        <Card className="relative">
          <CardContent className="p-3">
            <div className="relative">
              <Image
                src={value}
                alt="Preview"
                width={200}
                height={150}
                className="w-full h-40 object-cover rounded-md"
                onError={() => setUploadError('Erro ao carregar imagem')}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de ação */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={value ? "outline" : "default"}
          onClick={handleFileSelect}
          disabled={uploading}
          className="flex-1"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Fazendo upload...
            </>
          ) : (
            <>
              {value ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Alterar Imagem
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Adicionar Imagem
                </>
              )}
            </>
          )}
        </Button>
      </div>

      {/* Informações sobre upload */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Formatos aceitos: JPG, PNG, GIF, WebP</p>
        <p>• Tamanho máximo: 5MB</p>
        <p>• Recomendado: 300x200px ou superior</p>
      </div>

      {/* Erro de upload */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Erro de validação */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
} 