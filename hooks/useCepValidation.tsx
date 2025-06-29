import { useState } from 'react'

interface CepData {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export function useCepValidation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateCep = async (cep: string): Promise<CepData | null> => {
    const cleanCep = cep.replace(/\D/g, '')
    
    if (cleanCep.length !== 8) {
      setError('CEP deve ter 8 dígitos')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (data.erro) {
        setError('CEP não encontrado')
        return null
      }

      return data
    } catch (err) {
      setError('Erro ao consultar CEP. Verifique sua conexão.')
      return null
    } finally {
      setLoading(false)
    }
  }

  const formatCep = (value: string): string => {
    const clean = value.replace(/\D/g, '')
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  return {
    validateCep,
    formatCep,
    loading,
    error,
    clearError: () => setError(null)
  }
} 