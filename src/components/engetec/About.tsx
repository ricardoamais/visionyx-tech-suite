import { motion } from 'framer-motion';
import { CheckCircle2, Star } from 'lucide-react';

export const About = () => {
  return (
    <section id="sobre" className="py-24 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2 relative"
          >
            <div className="relative z-10 rounded-lg overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1541888946425-d81bb19480c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                alt="Engenheiro em obra" 
                className="w-full h-auto"
              />
            </div>
            {/* Experience badge */}
            <div className="absolute -bottom-8 -right-8 bg-[#f5a623] text-white p-8 rounded-sm shadow-xl z-20 hidden md:block">
              <p className="text-5xl font-bold mb-1">10+</p>
              <p className="text-sm font-semibold uppercase tracking-wider">Anos de Experiência</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a2e4a] mb-6">Sobre Nós</h2>
            <div className="w-20 h-1.5 bg-[#f5a623] mb-8"></div>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              A Engetec Engenharia & Projetos é uma empresa especializada em soluções de 
              engenharia para obras residenciais, comerciais e industriais, atendendo Fazenda Rio Grande, 
              Curitiba e toda a região metropolitana do Paraná.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {[
                "Equipe Técnica Qualificada",
                "Atendimento Personalizado",
                "Projetos dentro do Prazo",
                "Compromisso com a Qualidade"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2 className="text-[#f5a623] w-6 h-6" />
                  <span className="font-semibold text-[#1a2e4a]">{item}</span>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-[#f5a623] flex items-center gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-[#f5a623] mb-1">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={18} fill={s <= 4 ? "#f5a623" : "none"} />)}
                  <span className="text-[#1a2e4a] font-bold ml-2">4.6/5</span>
                </div>
                <p className="text-sm text-gray-500">Avaliação média baseada em 11 reviews no Google</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
