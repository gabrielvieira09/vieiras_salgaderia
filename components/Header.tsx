"use client"

import Link from "next/link"
import { ShoppingCart, User, LogOut, Settings, Package } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { Button } from "@/components/ui/button"

export default function Header() {
  const { user, logout } = useAuth()
  const { items } = useCart()

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="bg-vinho-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-laranja-400">Vieira's Salgaderia</div>
          </Link>

          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="hover:text-laranja-400 transition-colors">
              Início
            </Link>
            {user && (
              <Link href="/orders" className="hover:text-laranja-400 transition-colors flex items-center">
                <Package className="h-4 w-4 mr-1" />
                {user.isAdmin ? "Pedidos" : "Meus Pedidos"}
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/cart" className="relative hover:text-laranja-400 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-laranja-500 text-vinho-800 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm">Olá, {user.name}</span>
                {!user.isAdmin && (
                  <Link href="/profile">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-vinho-800 border-white hover:bg-gray"
                    >
                      <User className="h-4 w-4 mr-1" />
                      Perfil
                    </Button>
                  </Link>
                )}
                {user.isAdmin && (
                  <Link href="/admin">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-vinho-800 border-white hover:bg-gray"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="text-vinho-800 border-white hover:bg-gray"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-vinho-800 border-white"
                  >
                    <User className="h-4 w-4 mr-1" />
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-laranja-500 hover:bg-laranja-600 text-vinho-800">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
