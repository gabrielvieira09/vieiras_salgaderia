"use client";

import { useState } from "react";
import {
  Star,
  ShoppingCart,
  Edit,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart, type Product } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import ProductReview from "./ProductReview";
import { supabase } from "@/lib/supabaseClient";
import { useReviews } from "@/hooks/useReviews";

interface ProductCardProps {
  product: Product;
  onEdit?: () => void;
  showEditButton?: boolean;
}

export default function ProductCard({
  product,
  onEdit,
  showEditButton = false,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { reviews, averageRating } = useReviews(product.id);
  const [showReviews, setShowReviews] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentStock, setCurrentStock] = useState(product.stock);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleAddToCart = async () => {
    if (currentStock <= 0) {
      setNotification({ message: "Produto esgotado!", type: "error" });
      return;
    }

    setAddingToCart(true);

    try {
      const { data: currentProduct, error } = await supabase
        .from("products")
        .select("stock")
        .eq("id", product.id)
        .single();

      if (error) throw error;

      if (!currentProduct || currentProduct.stock <= 0) {
        setCurrentStock(0);
        setNotification({ message: "Produto esgotado!", type: "error" });
        return;
      }

      setCurrentStock((prev) => prev - 1);
      await addToCart({
        ...product,
        stock: currentProduct.stock,
      });

      setNotification({
        message: `${product.name} adicionado ao carrinho!`,
        type: "success",
      });
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      setCurrentStock(product.stock);
      setNotification({
        message: "Erro ao adicionar produto. Tente novamente.",
        type: "error",
      });
    } finally {
      setAddingToCart(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const toggleReviews = () => {
    setShowReviews(!showReviews);
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300 border-vinho-100">
      <div className="relative">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {showEditButton && (
          <Button
            onClick={onEdit}
            size="sm"
            className="absolute top-2 right-2 bg-laranja-500 hover:bg-laranja-600"
            aria-label="Editar produto"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {notification && (
          <div
            className={`
            fixed bottom-4 left-1/2 transform -translate-x-1/2 
            px-4 py-2 rounded-md text-white font-medium z-50
            ${notification.type === "success" ? "bg-green-500" : "bg-red-500"}
            animate-fade-in-up
          `}
          >
            {notification.message}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-vinho-800 group-hover:text-vinho-600 transition-colors">
            {product.name}
          </h3>
          <Badge
            variant="secondary"
            className="bg-laranja-100 text-laranja-800"
          >
            {product.category}
          </Badge>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-2">
          <div
            className={`text-sm font-medium ${
              currentStock > 10
                ? "text-green-600"
                : currentStock > 0
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {currentStock > 0
              ? `${currentStock} em estoque`
              : "Fora de estoque"}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(averageRating)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
                aria-hidden="true"
              />
            ))}
            <span className="text-sm text-gray-600 ml-1">
              {averageRating > 0
                ? `${averageRating.toFixed(1)} (${reviews.length})`
                : "Sem avaliações"}
            </span>
          </div>

          <div className="text-xl font-bold text-vinho-800">
            R$ {product.price.toFixed(2)}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col space-y-2">
        {!user?.isAdmin && (
          <Button
            onClick={handleAddToCart}
            disabled={currentStock === 0 || addingToCart}
            className="w-full bg-vinho-800 hover:bg-vinho-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            aria-label={
              currentStock === 0 ? "Produto esgotado" : "Adicionar ao carrinho"
            }
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {addingToCart
              ? "Adicionando..."
              : currentStock === 0
              ? "Fora de Estoque"
              : "Adicionar ao Carrinho"}
          </Button>
        )}

        {!user?.isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleReviews}
            className="w-full h-[35px] border-vinho-200 text-vinho-800 hover:bg-vinho-50 transition-colors"
            aria-expanded={showReviews}
            aria-controls="product-reviews"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Avaliar
            {showReviews ? (
              <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </Button>
        )}

        {showReviews && (
          <div
            id="product-reviews"
            className="w-full animate-in slide-in-from-top-2 duration-200"
          >
            <ProductReview productId={product.id} />
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
