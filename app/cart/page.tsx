"use client"

import { useRouter } from "next/navigation"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, total, loading: cartLoading } = useCart()
  const { user } = useAuth()
  const router = useRouter()

  const handleCheckout = () => {
    if (!user) {
      router.push("/login")
      return
    }
    
    router.push("/checkout")
  }
  

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-24 w-24 text-gray-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Seu carrinho está vazio</h2>
            <p className="mt-2 text-gray-600">Adicione alguns salgados deliciosos ao seu carrinho!</p>
            <Button onClick={() => router.push("/")} className="mt-6 bg-vinho-800 hover:bg-vinho-700">
              Ver Produtos
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (cartLoading && items.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Carregando seu carrinho...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-vinho-800 mb-8">Seu Carrinho</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items do Carrinho */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.product.id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.product.image || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.product.description}
                      </p>
                      <p className="text-lg font-bold text-vinho-800 mt-1">
                        R$ {item.product.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.product.stock > item.quantity
                          ? `${item.product.stock - item.quantity} restantes`
                          : "Última unidade no carrinho"}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        disabled={cartLoading}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={item.quantity >= item.product.stock || cartLoading}
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.product.id)}
                        disabled={cartLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-vinho-800">
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {item.quantity}x {item.product.name}
                      </span>
                      <span>
                        R$ {(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-vinho-800">
                      R$ {total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={cartLoading}
                  className="w-full bg-laranja-500 hover:bg-laranja-600 text-vinho-800 font-semibold"
                >
                  {cartLoading ? "Carregando..." : "Ir para Checkout"}
                </Button>

                {!user && (
                  <p className="text-sm text-gray-600 text-center">
                    Faça login para finalizar seu pedido
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
