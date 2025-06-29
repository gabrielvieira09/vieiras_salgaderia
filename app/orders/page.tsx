"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Eye, Package, Clock, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useOrders, type Order } from "@/hooks/useOrders"
import NFePDF from "@/components/NFePDF"

export default function OrdersPage() {
  const { user } = useAuth()
  const { orders, loading, error, updateOrderStatus } = useOrders()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isNFeDialogOpen, setIsNFeDialogOpen] = useState(false)

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'processing':
        return <Package className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800"
      case 'processing':
        return "bg-blue-100 text-blue-800"
      case 'completed':
        return "bg-green-100 text-green-800"
      case 'cancelled':
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return "Pendente"
      case 'processing':
        return "Processando"
      case 'completed':
        return "Concluído"
      case 'cancelled':
        return "Cancelado"
      default:
        return status
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    await updateOrderStatus(orderId, newStatus)
  }

  const openNFeDialog = (order: Order) => {
    setSelectedOrder(order)
    setIsNFeDialogOpen(true)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <p>Você precisa estar logado para ver seus pedidos.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-vinho-800">
            {user.isAdmin ? "Gerenciar Pedidos" : "Meus Pedidos"}
          </h1>
          <p className="text-gray-600 mt-2">
            {user.isAdmin 
              ? "Visualize e gerencie todos os pedidos do sistema" 
              : "Acompanhe seus pedidos e baixe as notas fiscais"
            }
          </p>
        </div>

        {error && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="text-center py-8">
            <p>Carregando pedidos...</p>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {user.isAdmin ? "Nenhum pedido encontrado no sistema." : "Você ainda não fez nenhum pedido."}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(order.created_at)}
                    </p>
                    {user.isAdmin && (
                      <p className="text-sm text-gray-600">
                        Cliente: {order.user_name} ({order.user_email})
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{getStatusLabel(order.status)}</span>
                    </Badge>
                    <p className="font-semibold text-lg">{formatCurrency(order.total_amount)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Itens do pedido */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Itens:</h4>
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span>{formatCurrency(item.total_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Endereço de entrega */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Endereço de entrega:</h4>
                  <p className="text-sm text-gray-600">
                    {order.shipping_address.street}, {order.shipping_address.number}<br />
                    {order.shipping_address.neighborhood}<br />
                    CEP: {order.shipping_address.cep}
                  </p>
                </div>

                {/* Ações */}
                <div className="flex space-x-2 pt-4 border-t">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes do Pedido #{order.id}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-medium">Status:</p>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <div>
                            <p className="font-medium">Total:</p>
                            <p>{formatCurrency(order.total_amount)}</p>
                          </div>
                          <div>
                            <p className="font-medium">Data:</p>
                            <p>{formatDate(order.created_at)}</p>
                          </div>
                          <div>
                            <p className="font-medium">Cliente:</p>
                            <p>{order.user_name}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="font-medium mb-2">Itens:</p>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between bg-gray-50 p-2 rounded">
                                <span>{item.quantity}x {item.product_name}</span>
                                <span>{formatCurrency(item.total_price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    onClick={() => openNFeDialog(order)}
                    size="sm"
                    className="bg-vinho-600 hover:bg-vinho-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar NFe
                  </Button>

                  {user.isAdmin && (
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value as Order['status'])}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="processing">Processando</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialog para NFe */}
        <Dialog open={isNFeDialogOpen} onOpenChange={setIsNFeDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Nota Fiscal Eletrônica - Pedido #{selectedOrder?.id}</DialogTitle>
            </DialogHeader>
            {selectedOrder && <NFePDF order={selectedOrder} />}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 