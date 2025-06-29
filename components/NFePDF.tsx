"use client"

import React, { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText } from "lucide-react"
import { useReactToPrint } from "react-to-print"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import type { Order } from "@/hooks/useOrders"

interface NFePDFProps {
  order: Order
  companyInfo?: {
    name: string
    cnpj: string
    address: string
    phone: string
    email: string
  }
}

const defaultCompanyInfo = {
  name: "Vieira's Salgaderia",
  cnpj: "12.983.058/0001-81",
  address: "Rua das Delicias, 123 - Centro Barretos - CEP: 12345-678",
  phone: "(16) 99654-9042",
  email: "contato@vieirassalgaderia.com"
}

export default function NFePDF({ order, companyInfo = defaultCompanyInfo }: NFePDFProps) {
  const componentRef = useRef<HTMLDivElement>(null)
  
  // Função para impressão direta
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `NFe-${order.id}`,
  })

  // Função para gerar PDF
  const generatePDF = async () => {
    if (!componentRef.current) return

    try {
      const canvas = await html2canvas(componentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`NFe-${order.id}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* Botões de ação */}
      <div className="flex gap-2 print:hidden">
        <Button onClick={generatePDF} size="sm">
          <Download className="h-4 w-4 mr-2" />
          Baixar PDF
        </Button>
      </div>

      {/* Documento NFe */}
      <div ref={componentRef} className="bg-white p-8 max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">NOTA FISCAL ELETRÔNICA</h1>
            <p className="text-sm text-gray-600">NFe nº {order.id}</p>
          </div>
        </div>

        {/* Informações da empresa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados do Emitente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Razão Social:</strong> {companyInfo.name}</p>
              <p><strong>CNPJ:</strong> {companyInfo.cnpj}</p>
              <p><strong>Endereço:</strong> {companyInfo.address}</p>
              <p><strong>Telefone:</strong> {companyInfo.phone}</p>
              <p><strong>E-mail:</strong> {companyInfo.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados do Destinatário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Nome:</strong> {order.user_name}</p>
              <p><strong>E-mail:</strong> {order.user_email}</p>
              <p><strong>Endereço de Entrega:</strong></p>
              <p className="pl-4">
                {order.shipping_address.street}, {order.shipping_address.number}<br />
                {order.shipping_address.neighborhood}<br />
                CEP: {order.shipping_address.cep}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Informações do pedido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Data de Emissão</p>
              <p className="font-medium">{formatDate(order.created_at)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Status do Pedido</p>
              <p className="font-medium capitalize">{order.status}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="font-medium text-lg">{formatCurrency(order.total_amount)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Itens do pedido */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Itens do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Produto</th>
                  <th className="border border-gray-300 p-2 text-center">Qtd</th>
                  <th className="border border-gray-300 p-2 text-right">Valor Unit.</th>
                  <th className="border border-gray-300 p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2">{item.product_name}</td>
                    <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 p-2 text-right">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {formatCurrency(item.total_price)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={3} className="border border-gray-300 p-2 text-right">
                    TOTAL GERAL:
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatCurrency(order.total_amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Esta nota fiscal eletrônica foi gerada automaticamente pelo sistema de pedidos da {companyInfo.name}.
              Para dúvidas ou problemas, entre em contato conosco através do e-mail {companyInfo.email} ou telefone {companyInfo.phone}.
            </p>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center">
          <p className="text-xs text-gray-500">
            Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  )
} 