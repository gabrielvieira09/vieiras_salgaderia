"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Filter, Package, Loader2 } from "lucide-react"
import ProductCard from "@/components/ProductCard"
import type { Product } from "@/contexts/CartContext"
import { supabase } from "@/lib/supabaseClient"
import Footer from "@/components/Footer"

const categories = [
  { value: "all", label: "Todos"},
  { value: "Fritos", label: "Fritos"},
  { value: "Assados", label: "Assados"},
  { value: "Doces", label: "Doces"},
]

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar produtos do banco de dados
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transformar dados do Supabase para o formato Product
      const transformedProducts: Product[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        image: item.image || "/placeholder.svg?height=200&width=300",
        category: item.category,
        rating: item.rating || 0,
        stock: item.stock || 0,
        reviews: []
      }))

      setProducts(transformedProducts)
    } catch (err) {
      console.error('Erro ao buscar produtos:', err)
      setError('Erro ao carregar produtos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar produtos
  useEffect(() => {
    let filtered = products

    // Filtrar por categoria
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }, [products, selectedCategory, searchTerm])

  const getProductStats = () => {
    const total = products.length
    const inStock = products.filter(p => p.stock > 0).length
    const categories = [...new Set(products.map(p => p.category))].length
    
    return { total, inStock, categories }
  }

  const stats = getProductStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-vinho-600 mb-4" />
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto text-red-400 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchProducts} className="bg-vinho-800 hover:bg-vinho-700">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <section className="bg-gradient-to-r h-[300px] from-vinho-800 to-vinho-600 text-white py-20">
        <div className="max-w-8xl mx-100 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Bem-vindo à <span className="text-laranja-400">Vieira's Salgaderia</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-vinho-100">
            Os melhores salgados da região, feitos com amor e tradição
          </p>
          
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-vinho-800 mb-6 text-center">
              Nossos Produtos
            </h2>
            
            {/* Search */}
            <div className="mb-6 max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-vinho-500"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`
                    ${selectedCategory === category.value
                      ? "bg-vinho-800 hover:bg-vinho-700 text-white"
                      : "border-vinho-200 text-vinho-800 hover:bg-vinho-50"
                    }
                  `}
                >
                  {category.label}
                  {category.value !== "all" && (
                    <Badge 
                      variant="secondary" 
                      className="ml-2 bg-laranja-100 text-laranja-800"
                    >
                      {products.filter(p => p.category === category.value).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center text-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              <span>
                {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                {selectedCategory !== "all" && ` em ${categories.find(c => c.value === selectedCategory)?.label}`}
                {searchTerm && ` para "${searchTerm}"`}
              </span>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `Não encontramos produtos para "${searchTerm}". Tente uma busca diferente.`
                  : selectedCategory !== "all"
                  ? `Não há produtos na categoria ${categories.find(c => c.value === selectedCategory)?.label}.`
                  : "Não há produtos disponíveis no momento."
                }
              </p>
              <div className="space-x-2">
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm("")}
                    className="border-vinho-200 text-vinho-800 hover:bg-vinho-50"
                  >
                    Limpar busca
                  </Button>
                )}
                {selectedCategory !== "all" && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedCategory("all")}
                    className="border-vinho-200 text-vinho-800 hover:bg-vinho-50"
                  >
                    Ver todos os produtos
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}
