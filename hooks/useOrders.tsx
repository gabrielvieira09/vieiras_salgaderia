"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/contexts/AuthContext"

export interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Order {
  id: string
  user_id: string
  user_name: string
  user_email: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  items: OrderItem[]
  total_amount: number
  created_at: string
  updated_at: string
  shipping_address: {
    street: string
    number: string
    neighborhood: string
    cep: string
  }
}

export const useOrders = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order("created_at", { ascending: false })

      // Se não for admin, filtrar apenas pedidos do usuário
      if (!user.isAdmin) {
        query = query.eq("user_id", user.id)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedOrders: Order[] = data?.map(order => ({
        id: order.id,
        user_id: order.user_id,
        user_name: order.user_name,
        user_email: order.user_email,
        status: order.status,
        items: order.order_items || [],
        total_amount: order.total_amount,
        created_at: order.created_at,
        updated_at: order.updated_at,
        shipping_address: {
          street: order.shipping_street || "",
          number: order.shipping_number || "",
          neighborhood: order.shipping_neighborhood || "",
          cep: order.shipping_cep || "",
        }
      })) || []

      setOrders(formattedOrders)
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError("Erro ao carregar pedidos")
    } finally {
      setLoading(false)
    }
  }

  const createOrder = async (cartItems: any[], shippingAddress: any) => {
    if (!user) {
      setError("Usuário não autenticado")
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

      // Criar o pedido
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          status: 'pending',
          total_amount: totalAmount,
          shipping_street: shippingAddress.street,
          shipping_number: shippingAddress.number,
          shipping_neighborhood: shippingAddress.neighborhood,
          shipping_cep: shippingAddress.cep,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Criar os itens do pedido
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
      }))

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)

      if (itemsError) throw itemsError

      await fetchOrders()
      return order.id
    } catch (err) {
      console.error("Error creating order:", err)
      setError("Erro ao criar pedido")
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!user?.isAdmin) {
      setError("Apenas administradores podem alterar o status do pedido")
      return false
    }

    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId)

      if (error) throw error

      await fetchOrders()
      return true
    } catch (err) {
      console.error("Error updating order status:", err)
      setError("Erro ao atualizar status do pedido")
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    refreshOrders: fetchOrders,
  }
} 