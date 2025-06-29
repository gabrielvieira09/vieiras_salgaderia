"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, Plus, Trash2, Package, Users, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import ProductCard from "@/components/ProductCard";
import ImagePicker from "@/components/ImagePicker";
import type { Product } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  price: z.number().positive("Preço deve ser positivo"),
  category: z.enum(["Fritos", "Assados", "Doces"], { required_error: "Selecione uma categoria" }),
  stock: z.number().min(0, "Estoque não pode ser negativo"),
  image: z.string().optional()
});

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0
  });
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    category: "",
    stock: "",
  });

  useEffect(() => {
    if (!user || !user.isAdmin) {
      router.push("/");
      return;
    }
    
    fetchProducts();
    fetchStats();
  }, [user, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProducts(data || []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Buscar estatísticas básicas
      const [productsCount, ordersCount, usersCount] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalProducts: productsCount.count || 0,
        totalOrders: ordersCount.count || 0,
        totalUsers: usersCount.count || 0
      });
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setError(null);

    try {
      // Validar e limpar dados
      const cleanPrice = formData.price.trim();
      const cleanStock = formData.stock.trim();
      const cleanImage = formData.image.trim();

      // Verificar se os campos numéricos são válidos
      if (!cleanPrice || isNaN(parseFloat(cleanPrice))) {
        setValidationErrors({ price: "Preço deve ser um número válido" });
        return;
      }

      if (!cleanStock || isNaN(parseInt(cleanStock))) {
        setValidationErrors({ stock: "Estoque deve ser um número válido" });
        return;
      }

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(cleanPrice),
        category: formData.category,
        stock: parseInt(cleanStock),
        image: cleanImage || "/placeholder.svg?height=200&width=300"
      };

      const result = productSchema.safeParse(productData);
      
      if (!result.success) {
        const errors: { [key: string]: string } = {};
        result.error.errors.forEach((error) => {
          errors[error.path[0]] = error.message;
        });
        setValidationErrors(errors);
        return;
      }

      setLoading(true);

      if (editingProduct) {
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select();

        if (error) throw error;
        console.log('✅ Produto atualizado com sucesso');
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select();

        if (error) throw error;
        console.log('✅ Produto criado com sucesso');
      }

      await fetchProducts();
      await fetchStats();
      resetForm();
    } catch (err) {
      console.error('❌ Erro ao salvar produto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao salvar produto: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image || "",
      category: product.category,
      stock: product.stock.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      await fetchProducts();
      await fetchStats();
    } catch (err) {
      console.error('Erro ao deletar produto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao deletar produto: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      image: "",
      category: "",
      stock: "",
    });
    setEditingProduct(null);
    setShowForm(false);
    setValidationErrors({});
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-vinho-800">
            Painel Administrativo
          </h1>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowForm(true)}
              className="bg-laranja-500 hover:bg-laranja-600 text-vinho-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-vinho-600" />
                <div className="ml-4">
                  <h2 className="text-2xl font-bold text-vinho-800">{stats.totalProducts}</h2>
                  <p className="text-gray-600">Produtos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingBag className="h-8 w-8 text-vinho-600" />
                <div className="ml-4">
                  <h2 className="text-2xl font-bold text-vinho-800">{stats.totalOrders}</h2>
                  <p className="text-gray-600">Pedidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-vinho-600" />
                <div className="ml-4">
                  <h2 className="text-2xl font-bold text-vinho-800">{stats.totalUsers}</h2>
                  <p className="text-gray-600">Usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Formulário */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Produto *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Nome do salgado"
                      className={validationErrors.name ? 'border-red-500' : ''}
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria *
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger className={validationErrors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fritos">Fritos</SelectItem>
                        <SelectItem value="Assados">Assados</SelectItem>
                        <SelectItem value="Doces">Doces</SelectItem>
                      </SelectContent>
                    </Select>
                    {validationErrors.category && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço (R$) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      className={validationErrors.price ? 'border-red-500' : ''}
                    />
                    {validationErrors.price && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          stock: e.target.value,
                        }))
                      }
                      placeholder="Quantidade em estoque"
                      className={validationErrors.stock ? 'border-red-500' : ''}
                    />
                    {validationErrors.stock && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.stock}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imagem do Produto (opcional)
                    </label>
                    <ImagePicker
                      value={formData.image}
                      onChange={(url) =>
                        setFormData((prev) => ({
                          ...prev,
                          image: url,
                        }))
                      }
                      error={validationErrors.image}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Descrição do produto"
                    rows={3}
                    className={validationErrors.description ? 'border-red-500' : ''}
                  />
                  {validationErrors.description && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-vinho-800 hover:bg-vinho-700"
                  >
                    {loading ? "Salvando..." : editingProduct ? "Atualizar" : "Criar"} Produto
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de Produtos */}
        {loading && !showForm ? (
          <div className="text-center py-8">
            <p>Carregando produtos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard
                  product={product}
                  showEditButton={true}
                  onEdit={() => handleEdit(product)}
                />
                <Button
                  onClick={() => handleDelete(product.id)}
                  variant="outline"
                  size="sm"
                  className="absolute top-2 left-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {products.length === 0 && !loading && (
              <div className="col-span-full text-center py-8">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Nenhum produto cadastrado ainda.</p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="mt-4 bg-vinho-800 hover:bg-vinho-700"
                >
                  Criar Primeiro Produto
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
