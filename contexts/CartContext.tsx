"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { supabase } from "@/lib/supabaseClient";

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  rating: number
  reviews: Review[]
  stock: number
}

interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  comment: string
  date: string
}

interface CartItem {
  id?: number // ID do item no Supabase
  product: Product
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  total: number
  loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const GUEST_CART_STORAGE_KEY = 'vieiras_guest_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [cartId, setCartId] = useState<number | null>(null)
  const [hasProcessedGuestCart, setHasProcessedGuestCart] = useState(false)

  // Load guest cart from localStorage
  const loadGuestCart = (): CartItem[] => {
    try {
      const stored = localStorage.getItem(GUEST_CART_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error loading guest cart:", error)
      return []
    }
  }

  // Save guest cart to localStorage
  const saveGuestCart = (cartItems: CartItem[]): void => {
    try {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cartItems))
    } catch (error) {
      console.error("Error saving guest cart:", error)
    }
  }

  // Clear guest cart from localStorage
  const clearGuestCart = (): void => {
    try {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY)
    } catch (error) {
      console.error("Error clearing guest cart:", error)
    }
  }

  // Load cart when user authentication state changes
  useEffect(() => {
    const loadCart = async () => {
      setLoading(true)
      try {
        if (user) {
          // User is authenticated, load their cart from Supabase
          
          // 1. Get or create user cart
          let { data: cart, error: cartError } = await supabase
            .from("carts")
            .select("id")
            .eq("user_id", user.id)
            .single()

          if (cartError && cartError.code !== "PGRST116") throw cartError

          if (!cart) {
            const { data: newCart, error: newCartError } = await supabase
              .from("carts")
              .insert({ user_id: user.id })
              .select("id")
              .single()

            if (newCartError) throw newCartError
            cart = newCart
          }

          setCartId(cart!.id)

          console.log("cart", cart)
          console.log("cartId", cart!.id)

          // 2. Load cart items from Supabase
          const { data: cartItems, error: itemsError } = await supabase
            .from("cart_items")
            .select(`
              id,
              quantity,
              products:product_id (
                id, name, description, price, image, category, rating, stock
              )
            `)
            .eq("cart_id", cart.id)

          if (itemsError) throw itemsError

          const dbItems = cartItems?.map(item => {
            const productData = Array.isArray(item.products) ? item.products[0] : item.products
            if (!productData) return null
            
            return {
              id: item.id,
              product: {
                id: productData.id,
                name: productData.name,
                description: productData.description || '',
                price: productData.price,
                image: productData.image || '',
                category: productData.category || '',
                rating: productData.rating || 0,
                stock: productData.stock || 0,
                reviews: []
              },
              quantity: item.quantity
            }
          }).filter(item => item !== null) as CartItem[] || []

          // 3. Handle guest cart restoration
          if (!hasProcessedGuestCart) {
            const guestCart = loadGuestCart()
            
            if (guestCart.length > 0) {
              if (dbItems.length === 0) {
                // User has no existing cart, restore guest cart
                console.log("Restoring guest cart for user with empty cart")
                await restoreGuestCartToUser(guestCart, cart!.id)
                // Reload items after restoration
                const { data: updatedItems, error: reloadError } = await supabase
                  .from("cart_items")
                  .select(`
                    id,
                    quantity,
                    products:product_id (
                      id, name, description, price, image, category, rating, stock
                    )
                  `)
                  .eq("cart_id", cart!.id)

                if (!reloadError) {
                  const restoredItems = updatedItems?.map(item => {
                    const productData = Array.isArray(item.products) ? item.products[0] : item.products
                    if (!productData) return null
                    
                    return {
                      id: item.id,
                      product: {
                        id: productData.id,
                        name: productData.name,
                        description: productData.description || '',
                        price: productData.price,
                        image: productData.image || '',
                        category: productData.category || '',
                        rating: productData.rating || 0,
                        stock: productData.stock || 0,
                        reviews: []
                      },
                      quantity: item.quantity
                    }
                  }).filter(item => item !== null) as CartItem[] || []
                  setItems(restoredItems)
                } else {
                  setItems(dbItems)
                }
              } else {
                // User already has items in cart, ignore guest cart
                console.log("User already has cart items, ignoring guest cart")
                setItems(dbItems)
              }
              
              // Clear guest cart after processing
              clearGuestCart()
            } else {
              setItems(dbItems)
            }
            
            setHasProcessedGuestCart(true)
          } else {
            setItems(dbItems)
          }
        } else {
          // User is not authenticated (logged out), clear current cart and load guest cart
          console.log("User logged out, clearing cart and loading guest cart")
          setCartId(null)
          setHasProcessedGuestCart(false)
          
          // Clear current cart items first
          setItems([])
          
          // Then load guest cart from localStorage
          const guestCart = loadGuestCart()
          setItems(guestCart)
        }
      } catch (error) {
        console.error("Error loading cart:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCart()
  }, [user, hasProcessedGuestCart])

  // Restore guest cart to authenticated user's cart
  const restoreGuestCartToUser = async (guestItems: CartItem[], cartId: number) => {
    try {
      for (const guestItem of guestItems) {
        await supabase
          .from("cart_items")
          .insert({
            cart_id: cartId,
            product_id: guestItem.product.id,
            quantity: Math.min(guestItem.quantity, guestItem.product.stock)
          })
      }
    } catch (error) {
      console.error("Error restoring guest cart:", error)
    }
  }

  const addToCart = async (product: Product) => {
    if (!user) {
      // Guest user logic - save to localStorage
      setItems((prev) => {
        const existingItem = prev.find((item) => item.product.id === product.id)
        const currentQuantity = existingItem ? existingItem.quantity : 0

        if (currentQuantity >= product.stock) {
          alert("Quantidade máxima em estoque atingida!")
          return prev
        }

        let newItems: CartItem[];
        
        if (existingItem) {
          newItems = prev.map((item) =>
            item.product.id === product.id 
              ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } 
              : item
          )
        } else {
          newItems = [...prev, { product, quantity: 1 }]
        }
        
        // Save to localStorage
        saveGuestCart(newItems)
        return newItems
      })
      return
    }

    // Authenticated user logic - save to Supabase
    if (!cartId) {
      console.error("No cartId available for authenticated user")
      return
    }

    console.log("Adding to cart with cartId:", cartId, "type:", typeof cartId)
    setLoading(true)
    try {
      // Check if item already exists in cart
      const { data: existingItem, error: existingError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("product_id", product.id)
        .single()

      if (existingError && existingError.code !== "PGRST116") throw existingError

      const newQuantity = existingItem ? Math.min(existingItem.quantity + 1, product.stock) : 1

      if (newQuantity <= 0) {
        await removeFromCart(product.id)
        return
      }

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: newQuantity })
          .eq("id", existingItem.id)

        if (error) throw error
      } else {
        // Add new item
        const { error } = await supabase
          .from("cart_items")
          .insert({
            cart_id: cartId,
            product_id: product.id,
            quantity: newQuantity
          })

        if (error) throw error
      }

      // Update local state
      setItems(prev => {
        const existing = prev.find(item => item.product.id === product.id)
        if (existing) {
          return prev.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: newQuantity }
              : item
          )
        }
        return [...prev, { product, quantity: newQuantity }]
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }

    if (!user) {
      // Guest user logic
      setItems(prev => {
        const newItems = prev.map(item => {
          if (item.product.id === productId) {
            const newQuantity = Math.min(quantity, item.product.stock)
            return { ...item, quantity: newQuantity }
          }
          return item
        })
        saveGuestCart(newItems)
        return newItems
      })
      return
    }

    // Authenticated user logic
    if (!cartId) return

    setLoading(true)
    try {
      // Find item in cart
      const { data: existingItem, error: existingError } = await supabase
        .from("cart_items")
        .select("id")
        .eq("cart_id", cartId)
        .eq("product_id", productId)
        .single()

      if (existingError) throw existingError

      const newQuantity = Math.min(quantity, items.find(i => i.product.id === productId)?.product.stock || quantity)

      // Update in Supabase
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", existingItem.id)

      if (error) throw error

      // Update local state
      setItems(prev =>
        prev.map(item =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      )
    } catch (error) {
      console.error("Error updating quantity:", error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (productId: string) => {
    if (!user) {
      // Guest user logic
      setItems(prev => {
        const newItems = prev.filter(item => item.product.id !== productId)
        saveGuestCart(newItems)
        return newItems
      })
      return
    }

    // Authenticated user logic
    if (!cartId) return

    setLoading(true)
    try {
      // Find item in cart
      const { data: existingItem, error: existingError } = await supabase
        .from("cart_items")
        .select("id")
        .eq("cart_id", cartId)
        .eq("product_id", productId)
        .single()

      if (existingError && existingError.code !== "PGRST116") throw existingError

      if (existingItem) {
        // Remove from Supabase
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", existingItem.id)

        if (error) throw error
      }

      // Update local state
      setItems(prev => prev.filter(item => item.product.id !== productId))
    } catch (error) {
      console.error("Error removing from cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    if (!user) {
      // Guest user logic
      setItems([])
      clearGuestCart()
      return
    }

    // Authenticated user logic
    if (!cartId) return

    setLoading(true)
    try {
      // Clear all cart items in Supabase
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", cartId)

      if (error) throw error

      // Update local state
      setItems([])
    } catch (error) {
      console.error("Error clearing cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
        loading
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}