import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Clock, MessageSquare } from 'lucide-react';

export const Contact = () => {
  return (
    <section id="contato" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Form Column */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:w-3/5"
          >
            <h2 className="text-3xl font-bold text-[#1a2e4a] mb-4">Solicite um Orçamento</h2>
            <div className="w-20 h-1.5 bg-[#f5a623] mb-8"></div>
            <p className="text-gray-600 mb-10">
              Preencha o formulário abaixo e nossa equipe técnica entrará em contato em breve para 
              entender melhor sua necessidade e fornecer uma proposta detalhada.
            </p>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1a2e4a]">Nome Completo</label>
                  <Input placeholder="Seu nome" className="rounded-sm border-gray-300 focus:border-[#f5a623] focus:ring-[#f5a623]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1a2e4a]">E-mail</label>
                  <Input type="email" placeholder="seu@email.com" className="rounded-sm border-gray-300 focus:border-[#f5a623] focus:ring-[#f5a623]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1a2e4a]">Telefone / WhatsApp</label>
                  <Input placeholder="(00) 00000-0000" className="rounded-sm border-gray-300 focus:border-[#f5a623] focus:ring-[#f5a623]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1a2e4a]">Tipo de Serviço</label>
                  <select className="w-full h-10 px-3 rounded-sm border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-transparent">
                    <option>Projeto Arquitetônico</option>
                    <option>Projeto Elétrico</option>
                    <option>Projeto Hidrossanitário</option>
                    <option>Projeto Estrutural</option>
                    <option>Regularização de Imóvel</option>
                    <option>Outros</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#1a2e4a]">Mensagem</label>
                <Textarea placeholder="Descreva brevemente sua necessidade..." className="min-h-[150px] rounded-sm border-gray-300 focus:border-[#f5a623] focus:ring-[#f5a623]" />
              </div>

              <Button className="w-full bg-[#f5a623] hover:bg-[#d48c1a] text-white font-bold py-6 text-lg rounded-sm transition-all shadow-lg hover:shadow-[#f5a623]/20">
                Enviar Mensagem
              </Button>
            </form>
          </motion.div>

          {/* Info Column */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:w-2/5 space-y-12"
          >
            <div>
              <h3 className="text-xl font-bold text-[#1a2e4a] mb-6">Informações de Contato</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-[#1a2e4a] p-3 rounded-lg text-white">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-[#1a2e4a]">Endereço</p>
                    <p className="text-gray-600">R. Inglaterra, 352 - Nações, Fazenda Rio Grande - PR, 83823-008</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-[#1a2e4a] p-3 rounded-lg text-white">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-[#1a2e4a]">Telefone</p>
                    <p className="text-gray-600">(41) 3627-7293</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-[#1a2e4a] p-3 rounded-lg text-white">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-[#1a2e4a]">Horário de Atendimento</p>
                    <p className="text-gray-600">Segunda à Sexta: 08:00 – 17:00</p>
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-6 flex items-center justify-center gap-3 rounded-sm text-lg shadow-lg hover:shadow-[#25D366]/20">
              <MessageSquare size={24} /> Chamar no WhatsApp
            </Button>

            {/* Google Maps Embed */}
            <div className="rounded-lg overflow-hidden border border-gray-200 h-64 shadow-inner">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3598.6664988015335!2d-49.30847202377319!3d-25.649191377422026!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94dcf9f5d9183617%3A0x6295240217ec8274!2sR.%20Inglaterra%2C%20352%20-%20Na%C3%A7%C3%B5es%2C%20Fazenda%20Rio%20Grande%20-%20PR%2C%2083823-008!5e0!3m2!1spt-BR!2sbr!4v1714838400000!5m2!1spt-BR!2sbr" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
