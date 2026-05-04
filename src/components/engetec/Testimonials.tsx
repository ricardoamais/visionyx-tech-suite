import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "Ricardo Silva",
    role: "Proprietário Residencial",
    content: "Excelente atendimento! O projeto elétrico e estrutural da minha casa foi feito com muita precisão. Recomendo fortemente a Engetec.",
    rating: 5
  },
  {
    name: "Ana Oliveira",
    role: "Empresária",
    content: "Precisávamos regularizar nosso galpão comercial e a equipe da Engetec resolveu tudo de forma rápida e profissional junto à prefeitura.",
    rating: 5
  },
  {
    name: "Marcos Ferreira",
    role: "Arquiteto Parceiro",
    content: "Parceria de anos. Projetos complementares de alta qualidade que facilitam muito a execução da obra no canteiro.",
    rating: 4
  }
];

export const Testimonials = () => {
  return (
    <section className="py-24 bg-[#1a2e4a] text-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">O que dizem nossos clientes</h2>
          <div className="w-20 h-1.5 bg-[#f5a623] mx-auto mb-6"></div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl font-bold">4.6</span>
            <div className="flex text-[#f5a623]">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={20} fill={s <= 4 ? "#f5a623" : "none"} />)}
            </div>
          </div>
          <p className="text-gray-400">Nota média baseada no Google Reviews</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white/5 p-8 rounded-lg border border-white/10 relative"
            >
              <Quote className="absolute top-6 right-6 text-white/10 w-12 h-12" />
              <div className="flex text-[#f5a623] mb-4">
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={16} fill={s <= t.rating ? "#f5a623" : "none"} />)}
              </div>
              <p className="text-gray-300 italic mb-6">"{t.content}"</p>
              <div>
                <p className="font-bold">{t.name}</p>
                <p className="text-sm text-[#f5a623]">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <a href="#" className="text-[#f5a623] hover:underline font-semibold">Ver todas as avaliações no Google</a>
        </div>
      </div>
    </section>
  );
};
