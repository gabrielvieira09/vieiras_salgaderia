"use client"

import { useState } from "react"
import { Star, Send, AlertCircle, StarOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { useReviews } from "@/hooks/useReviews"
import { z } from "zod"

const reviewSchema = z.object({
  rating: z.number().min(1, "Selecione uma nota de 1 a 5").max(5, "Nota máxima é 5"),
  comment: z.string().min(10, "Comentário deve ter pelo menos 10 caracteres").max(500, "Comentário muito longo")
})

interface ProductReviewProps {
  productId: string
}

export default function ProductReview({ productId }: ProductReviewProps) {
  const { user } = useAuth()
  const { reviews, loading, error, submitReview, getUserReview, averageRating } = useReviews(productId)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const userReview = getUserReview()

  const handleSubmitReview = async () => {
    try {
      setValidationErrors({})
      
      const result = reviewSchema.safeParse({ rating, comment })
      
      if (!result.success) {
        const errors: { [key: string]: string } = {}
        result.error.errors.forEach((error) => {
          errors[error.path[0]] = error.message
        })
        setValidationErrors(errors)
        return
      }

      setIsSubmitting(true)
      const success = await submitReview(rating, comment)
      
      if (success) {
        setRating(0)
        setComment("")
        setShowReviewForm(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setShowReviewForm(false)
    setRating(0)
    setHoveredRating(0)
    setComment("")
    setValidationErrors({})
  }

  const renderStars = (currentRating: number, interactive: boolean = false, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "h-3 w-3",
      md: "h-4 w-4", 
      lg: "h-6 w-6"
    }

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= currentRating
          const isHovered = interactive && star <= hoveredRating
          
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && setRating(star)}
              onMouseEnter={() => interactive && setHoveredRating(star)}
              onMouseLeave={() => interactive && setHoveredRating(0)}
              className={`
                ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
                focus:outline-none focus:ring-2 focus:ring-laranja-300 rounded
              `}
            >
              <Star
                className={`
                  ${sizeClasses[size]}
                  ${isFilled || isHovered 
                    ? "text-yellow-400 fill-current" 
                    : "text-gray-300"
                  }
                  ${interactive && isHovered ? 'drop-shadow-sm' : ''}
                `}
              />
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Média das avaliações */}
      {reviews.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(averageRating), false, "md")}
              <span className="text-sm font-medium text-gray-700">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <Badge variant="secondary" className="bg-vinho-100 text-vinho-800">
              {reviews.length} avaliação{reviews.length !== 1 ? '' : ''}
            </Badge>
          </div>
        </div>
      )}

      {/* Mensagens de erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Formulário de avaliação */}
      {user && !userReview && (
        <div>
          {!showReviewForm ? (
            <Button
              onClick={() => setShowReviewForm(true)}
              variant="outline"
              size="sm"
              className="w-full border-laranja-200 text-laranja-800 hover:bg-laranja-50"
            >
              <Star className="h-4 w-4 mr-2" />
              Escrever Avaliação
            </Button>
          ) : (
            <Card className="border-laranja-200 bg-laranja-50/30">
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Sua avaliação:
                  </label>
                  <div className="flex items-center space-x-2">
                    {renderStars(hoveredRating || rating, true, "lg")}
                    {(rating > 0 || hoveredRating > 0) && (
                      <span className="text-sm text-gray-600 ml-2">
                        {hoveredRating || rating} de 5 estrelas
                      </span>
                    )}
                  </div>
                  {validationErrors.rating && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.rating}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Comentário:
                  </label>
                  <Textarea
                    placeholder="Conte-nos sobre sua experiência com este produto..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="resize-none border-gray-200 focus:border-laranja-300"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {validationErrors.comment && (
                      <p className="text-red-500 text-xs">{validationErrors.comment}</p>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {comment.length}/500
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-laranja-500 hover:bg-laranja-600"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
                  </Button>
                  <Button
                    onClick={resetForm}
                    variant="outline" 
                    size="sm"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Mostrar se o usuário já avaliou */}
      {userReview && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Você já avaliou este produto. Obrigado pelo seu feedback!
          </AlertDescription>
        </Alert>
      )}

      {/* Mostrar aviso se não estiver logado */}
      {!user && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Faça login para avaliar este produto.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de avaliações */}
      {loading && <div className="text-center py-4 text-gray-500">Carregando avaliações...</div>}
      
      {reviews.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800 text-sm">Todas as avaliações:</h4>
          <div className="max-h-60 overflow-y-auto space-y-3">
            {reviews.map((review) => (
              <Card key={review.id} className="border-gray-200">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium text-sm text-gray-900">{review.user_name}</span>
                      <div className="flex items-center space-x-1 mt-1">
                        {renderStars(review.rating, false, "sm")}
                        <span className="text-xs text-gray-500 ml-1">
                          {new Date(review.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {!loading && reviews.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <StarOff className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Ainda não há avaliações para este produto.</p>
          {user && !userReview && (
            <p className="text-xs text-gray-400 mt-1">Seja o primeiro a avaliar!</p>
          )}
        </div>
      )}
    </div>
  )
}
