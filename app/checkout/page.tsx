"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, MapPin, CreditCard, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { useOrders } from "@/hooks/useOrders"
import { useCepValidation } from "@/hooks/useCepValidation"
import { z } from "zod"

const checkoutSchema = z.object({
  street: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  number: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().min(3, "Bairro deve ter pelo menos 3 caracteres"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP deve ter formato 00000-000")
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const { user } = useAuth()
  const { items, total, clearCart } = useCart()
  const { createOrder } = useOrders()
  const { validateCep, formatCep, loading: cepLoading, error: cepError, clearError } = useCepValidation()
  const router = useRouter()

  const [formData, setFormData] = useState<CheckoutFormData>({
    street: user?.street || "",
    number: user?.number || "",
    neighborhood: user?.neighborhood || "",
    cep: user?.cep || ""
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)
  const [cepValidated, setCepValidated] = useState(false)

  // Auto-validate CEP when it's complete
  useEffect(() => {
    const cleanCep = formData.cep.replace(/\D/g, '')
    if (cleanCep.length === 8 && !cepValidated) {
      handleCepValidation(formData.cep)
    }
  }, [formData.cep])

  const handleCepValidation = async (cep: string) => {
    const cepData = await validateCep(cep)
    if (cepData) {
      setFormData(prev => ({
        ...prev,
        street: cepData.logradouro || prev.street,
        neighborhood: cepData.bairro || prev.neighborhood,
        cep: formatCep(cep)
      }))
      setCepValidated(true)
      if (errors.cep) {
        setErrors(prev => ({ ...prev, cep: "" }))
      }
    } else {
      setCepValidated(false)
    }
  }

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    if (field === 'cep') {
      const formatted = formatCep(value)
      setFormData(prev => ({ ...prev, [field]: formatted }))
      setCepValidated(false)
      clearError()
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Verificar se o CEP foi validado
    if (!cepValidated && formData.cep) {
      setErrors({ cep: "Aguarde a validação do CEP ou verifique se está correto" })
      return
    }

    if (cepError) {
      setErrors({ cep: cepError })
      return
    }

    setLoading(true)

    try {
      // Validar com Zod
      const result = checkoutSchema.safeParse(formData)
      
      if (!result.success) {
        const fieldErrors: { [key: string]: string } = {}
        result.error.errors.forEach((error) => {
          fieldErrors[error.path[0]] = error.message
        })
        setErrors(fieldErrors)
        return
      }

      // Criar pedido
      const orderId = await createOrder(items, formData)
      
      if (orderId) {
        setOrderSuccess(orderId)
        await clearCart()
        // Redirecionar para página de pedidos após 3 segundos
        setTimeout(() => {
          router.push('/orders')
        }, 3000)
      }
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error)
      setErrors({ general: "Erro ao finalizar pedido. Tente novamente." })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p>Você precisa estar logado para finalizar a compra.</p>
            <Button onClick={() => router.push('/login')} className="mt-4">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>Seu carrinho está vazio.</p>
            <Button onClick={() => router.push('/')} className="mt-4">
              Continuar Comprando
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-green-800 mb-2">Pedido Realizado!</h2>
            <p className="text-gray-600 mb-4">
              Seu pedido #{orderSuccess} foi criado com sucesso.
            </p>
            <p className="text-sm text-gray-500">
              Redirecionando para seus pedidos...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-vinho-800">Finalizar Compra</h1>
          <p className="text-gray-600 mt-2">Revise seus itens e confirme o endereço de entrega</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Endereço de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP *
                  </label>
                  <div className="relative">
                    <Input
                      value={formData.cep}
                      onChange={(e) => handleInputChange('cep', e.target.value)}
                      className={errors.cep || cepError ? 'border-red-500' : cepValidated ? 'border-green-500' : ''}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {cepLoading && (
                      <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 transform -translate-y-1/2" />
                    )}
                    {cepValidated && !cepLoading && (
                      <CheckCircle className="h-4 w-4 text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
                    )}
                  </div>
                  {(errors.cep || cepError) && (
                    <p className="text-red-500 text-xs mt-1">{errors.cep || cepError}</p>
                  )}
                  {cepValidated && !cepError && (
                    <p className="text-green-500 text-xs mt-1">CEP validado com sucesso!</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rua/Avenida *
                    </label>
                    <Input
                      value={formData.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      className={errors.street ? 'border-red-500' : ''}
                      placeholder="Rua das Flores"
                      disabled={cepLoading}
                    />
                    {errors.street && (
                      <p className="text-red-500 text-xs mt-1">{errors.street}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número *
                    </label>
                    <Input
                      value={formData.number}
                      onChange={(e) => handleInputChange('number', e.target.value)}
                      className={errors.number ? 'border-red-500' : ''}
                      placeholder="123"
                    />
                    {errors.number && (
                      <p className="text-red-500 text-xs mt-1">{errors.number}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro *
                  </label>
                  <Input
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    className={errors.neighborhood ? 'border-red-500' : ''}
                    placeholder="Centro"
                    disabled={cepLoading}
                  />
                  {errors.neighborhood && (
                    <p className="text-red-500 text-xs mt-1">{errors.neighborhood}</p>
                  )}
                </div>

                {errors.general && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.general}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading || cepLoading || !cepValidated}
                  className="w-full bg-vinho-800 hover:bg-vinho-700 disabled:bg-gray-400"
                >
                  {loading ? "Finalizando..." : `Finalizar Pedido - ${formatCurrency(total)}`}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resumo do pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.quantity}x {formatCurrency(item.product.price)}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega:</span>
                    <span>Grátis</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    O pagamento será realizado na entrega (dinheiro ou cartão).
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 