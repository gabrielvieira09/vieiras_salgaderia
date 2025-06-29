"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/contexts/AuthContext"

export interface Review {
  id: string
  product_id: string
  user_id: string
  user_name: string
  rating: number
  comment: string
  created_at: string
}

export const useReviews = (productId: string) => {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setReviews(data || [])
    } catch (err) {
      console.error("Error fetching reviews:", err)
      setError("Erro ao carregar avaliações")
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async (rating: number, comment: string) => {
    if (!user) {
      setError("Você precisa estar logado para avaliar")
      return false
    }

    try {
      setLoading(true)
      setError(null)

      // Verificar se o usuário já avaliou este produto
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .single()

      if (existingReview) {
        setError("Você já avaliou este produto")
        return false
      }

      const { error } = await supabase
        .from("reviews")
        .insert({
          product_id: productId,
          user_id: user.id,
          user_name: user.name,
          rating,
          comment,
        })

      if (error) throw error

      // Recarregar avaliações
      await fetchReviews()
      return true
    } catch (err) {
      console.error("Error submitting review:", err)
      setError("Erro ao enviar avaliação")
      return false
    } finally {
      setLoading(false)
    }
  }

  const getUserReview = () => {
    if (!user) return null
    return reviews.find((review) => review.user_id === user.id)
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  useEffect(() => {
    if (productId) {
      fetchReviews()
    }
  }, [productId])

  return {
    reviews,
    loading,
    error,
    submitReview,
    getUserReview,
    averageRating,
    refreshReviews: fetchReviews,
  }
} 