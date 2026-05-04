import { Hammer, Instagram, Facebook, Mail, MapPin, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#1a2e4a] text-white pt-20 pb-10 border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Logo & Slogan */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-[#f5a623] p-1.5 rounded-sm">
                <Hammer className="text-white w-6 h-6" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">
                Engetec
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Engenharia com Precisão e Compromisso. Transformamos projetos em realidade com excelência técnica e ética profissional.
            </p>
            <div className="flex gap-4">
              <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-[#f5a623] transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-[#f5a623] transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-[#f5a623] transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-[#f5a623]">Links Rápidos</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#inicio" className="hover:text-white transition-colors">Início</a></li>
              <li><a href="#servicos" className="hover:text-white transition-colors">Serviços</a></li>
              <li><a href="#sobre" className="hover:text-white transition-colors">Sobre Nós</a></li>
              <li><a href="#projetos" className="hover:text-white transition-colors">Projetos</a></li>
              <li><a href="#contato" className="hover:text-white transition-colors">Contato</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-[#f5a623]">Fale Conosco</h4>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-[#f5a623] shrink-0" />
                <span className="text-sm">R. Inglaterra, 352 - Nações, Fazenda Rio Grande - PR</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-[#f5a623] shrink-0" />
                <span className="text-sm">(41) 3627-7293</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-[#f5a623] shrink-0" />
                <span className="text-sm">contato@engetec.eng.br</span>
              </li>
            </ul>
          </div>

          {/* Newsletter / Badge */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-[#f5a623]">Localização</h4>
            <p className="text-gray-400 text-sm mb-4">
              Fazenda Rio Grande, Paraná — Brasil.
              Atendemos toda a Curitiba e Região Metropolitana.
            </p>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-xs text-gray-400 font-semibold mb-1 italic">CREA-PR / CAU-PR</p>
              <p className="text-xs text-white">Empresa Registrada e Habilitada</p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
          <p>© 2025 Engetec Engenharia & Projetos. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacidade</a>
            <a href="#" className="hover:text-white">Termos de Uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
