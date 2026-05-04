import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Star, ChevronRight } from 'lucide-react';

export const Hero = () => {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1503387762-592dee58c460?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e4a] via-[#1a2e4a]/90 to-transparent"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/blueprint.png')]"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              Soluções em Engenharia e <br />
              <span className="text-[#f5a623]">Projetos para Você</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
              Excelência técnica em projetos elétricos, hidráulicos, estruturais e regularização 
              de imóveis na região de Curitiba e Fazenda Rio Grande.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 mb-12"
          >
            <Button className="bg-[#f5a623] hover:bg-[#d48c1a] text-white px-8 py-6 text-lg rounded-sm flex items-center gap-2">
              Ver Nossos Serviços <ChevronRight size={20} />
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#1a2e4a] px-8 py-6 text-lg rounded-sm">
              Fale Conosco
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-wrap items-center gap-8 md:gap-16 pt-8 border-t border-white/10"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-[#f5a623] mb-1">
                <Star size={16} fill="#f5a623" />
                <span className="text-white font-bold text-xl">4.6</span>
              </div>
              <span className="text-gray-400 text-sm">Google Reviews</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-xl">+100</span>
              <span className="text-gray-400 text-sm">Projetos Entregues</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-xl">10+</span>
              <span className="text-gray-400 text-sm">Anos de Experiência</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
