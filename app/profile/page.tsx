"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Phone, MapPin, Home, Building, Save } from "lucide-react";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    number: "",
    cep: "",
    neighborhood: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.isAdmin) {
      router.push("/");
      return;
    }

    // Preencher formulário com dados do usuário
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      street: user.street,
      neighborhood: user.neighborhood,
      number: user.number,
      cep: user.cep,
    });
  }, [user, router]);

  if (!user || user.isAdmin) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
   
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const success = await updateProfile(formData);
      if (success) {
        setMessage("Perfil atualizado com sucesso!");
      } else {
        setMessage("Erro ao atualizar perfil.");
      }
    } catch (err) {
      setMessage("Erro ao atualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vinho-50 to-laranja-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-vinho-800">
              Meu Perfil
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Edite suas informações pessoais
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Pessoais */}
              <div>
                <h3 className="text-lg font-medium text-vinho-800 mb-4">
                  Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h3 className="text-lg font-medium text-vinho-800 mb-4">
                  Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rua
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        name="street"
                        type="text"
                        value={formData.street}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="Nome da rua"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bairro
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        name="neighborhood"
                        type="text"
                        value={formData?.neighborhood}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="Nome do bairro"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número
                    </label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        name="number"
                        type="text"
                        value={formData?.number}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP
                    </label>
                    <Input
                      name="cep"
                      type="text"
                      value={formData?.cep}
                      onChange={handleChange}
                      placeholder="12345-678"
                      required
                    />
                  </div>
                </div>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg text-center ${
                    message.includes("sucesso")
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {message}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-vinho-800 hover:bg-vinho-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
