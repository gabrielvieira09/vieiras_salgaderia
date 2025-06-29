import { MapPin, Phone, Mail, Clock } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-vinho-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-laranja-400 mb-4">Vieira's Salgaderia</h3>
            <p className="text-gray-300 mb-4">
              Os melhores salgados da região, feitos com amor e ingredientes selecionados. Tradição e sabor em cada
              mordida.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-laranja-400">Contato</h4>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-laranja-400" />
                <span>Rua das Delícias, 123 - Centro Barretos</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-laranja-400" />
                <span>(17) 99689-1422</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-laranja-400" />
                <span>contato@vieiras.com</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-laranja-400">Horário de Funcionamento</h4>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-laranja-400" />
                <div>
                  <p>Segunda à Sexta: 7h às 19h</p>
                  <p>Sábado: 7h às 17h</p>
                  <p>Domingo: 8h às 14h</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-vinho-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Vieira's Salgaderia. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
